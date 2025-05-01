// src/screens/ProjectScreen.tsx - opravená verze s robustním zpracováním dat
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  SectionList,
  RefreshControl,
  Alert
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getProject } from '../api/projects';
import { startTimeEntry } from '../api/timeEntries';
import { Project, TimeEntry } from '../types/api.types';
import { formatTime, formatDate, formatDuration } from '../utils/formatters';
import { useTimeEntry } from '../contexts/TimeEntryContext';

const ProjectScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { runningEntry, startTimer, refreshRunningEntry } = useTimeEntry();

  const [project, setProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTimer, setStartingTimer] = useState(false);
  const [description, setDescription] = useState('');
  const [groupedEntries, setGroupedEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Získáme ID projektu z navigačních parametrů
  const projectId = route.params?.id;

  // Funkce pro seskupení časových záznamů podle data
  const groupTimeEntriesByDate = useCallback((entries: TimeEntry[]) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    try {
      // Vytvoříme hash mapu pro seskupení záznamů
      const groupedHash: { [date: string]: TimeEntry[] } = {};

      entries.forEach(entry => {
        if (!entry || !entry.startTime) {
          console.warn('Neplatný časový záznam:', entry);
          return; // Přeskočíme neplatný záznam
        }

        try {
          const entryDate = new Date(entry.startTime);
          const dateString = formatDate(entryDate);

          if (!groupedHash[dateString]) {
            groupedHash[dateString] = [];
          }

          groupedHash[dateString].push(entry);
        } catch (dateError) {
          console.warn('Chyba při zpracování data záznamu:', dateError);
        }
      });

      // Převedeme na pole pro SectionList
      const result = Object.keys(groupedHash).map(date => ({
        title: date,
        data: groupedHash[date]
      }));

      // Seřadíme sekce podle data (od nejnovějšího)
      result.sort((a, b) => {
        try {
          const dateA = new Date(a.data[0].startTime);
          const dateB = new Date(b.data[0].startTime);
          return dateB.getTime() - dateA.getTime();
        } catch (e) {
          return 0; // V případě chyby neměníme pořadí
        }
      });

      return result;
    } catch (error) {
      console.error("Chyba při seskupování časových záznamů:", error);
      return [];
    }
  }, []);

  // Načtení dat projektu
  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError('Chybějící ID projektu');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log(`Načítám projekt #${projectId}`);
      const data = await getProject(projectId);

      if (!data) {
        throw new Error('Prázdná odpověď z API');
      }

      console.log('Projekt načten:', data.name);
      setProject(data);

      // Časové záznamy by měly být součástí odpovědi z API
      if (data.timeEntries && Array.isArray(data.timeEntries)) {
        console.log(`Načteno ${data.timeEntries.length} časových záznamů`);
        setTimeEntries(data.timeEntries);

        // Seskupíme časové záznamy podle data
        const grouped = groupTimeEntriesByDate(data.timeEntries);
        setGroupedEntries(grouped);
      } else {
        console.warn('Projekt neobsahuje časové záznamy nebo nejsou v očekávaném formátu');
        setTimeEntries([]);
        setGroupedEntries([]);
      }
    } catch (error) {
      console.error('Chyba při načítání projektu:', error);
      setError(`Nepodařilo se načíst data: ${error.message || 'neznámá chyba'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, groupTimeEntriesByDate]);

  // Obnovení dat při návratu na obrazovku
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        loadProject();
        refreshRunningEntry();
      }
    }, [projectId, loadProject])
  );

  // Obnovení dat při zatažení dolů (pull-to-refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProject();
  }, [loadProject]);

  // Spuštění časovače
  const handleStartTimer = async () => {
    if (startingTimer || !projectId) return;

    try {
      setStartingTimer(true);
      await startTimer(projectId, description);
      setDescription('');

      // Aktualizujeme informace o projektu
      await loadProject();
      await refreshRunningEntry();
    } catch (error) {
      console.error('Chyba při spouštění časovače:', error);
      Alert.alert(
        'Chyba',
        `Nepodařilo se spustit časovač: ${error.message || 'neznámá chyba'}`
      );
    } finally {
      setStartingTimer(false);
    }
  };

  // Kontrola, zda je časovač spuštěn pro tento projekt
  const isTimerRunningForProject = useCallback(() => {
    return runningEntry && runningEntry.project && runningEntry.project.id === projectId;
  }, [runningEntry, projectId]);

  // Výpočet celkové doby pro den
  const calculateDayTotal = useCallback((entries: TimeEntry[]) => {
    if (!Array.isArray(entries)) return '0h 0m';

    let totalSeconds = 0;

    entries.forEach(entry => {
      if (entry.endTime) {
        try {
          const startTime = new Date(entry.startTime).getTime();
          const endTime = new Date(entry.endTime).getTime();
          if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
            totalSeconds += (endTime - startTime) / 1000;
          }
        } catch (e) {
          console.warn('Chyba při výpočtu trvání záznamu:', e);
        }
      }
    });

    return formatDuration(totalSeconds);
  }, []);

  // Vykreslení položky časového záznamu
  const renderTimeEntryItem = useCallback(({ item }: { item: TimeEntry }) => {
    if (!item || !item.id || !item.startTime) {
      return null; // Přeskočíme neplatný záznam
    }

    return (
      <TouchableOpacity
        style={styles.entryItem}
        onPress={() => navigation.navigate('TimeEntry', { id: item.id })}
      >
        <View style={styles.entryRow}>
          <View style={styles.entryTimeWrapper}>
            <Text style={styles.entryTime}>
              {formatTime(new Date(item.startTime))}
              {item.endTime ? ` - ${formatTime(new Date(item.endTime))}` : ''}
            </Text>

            {!item.endTime && (
              <View style={styles.runningBadge}>
                <Text style={styles.runningText}>BĚŽÍ</Text>
              </View>
            )}
          </View>

          <Text style={styles.entryDuration}>
            {item.endTime ? (
              <Text>{(item.durationInHours || 0).toFixed(2)} h</Text>
            ) : (
              <Text style={{color: "#4CAF50", fontWeight: "bold"}}>•••</Text>
            )}
          </Text>
        </View>

        {item.description && (
          <Text style={styles.entryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.isBillable && item.endTime && (
          <View style={styles.billableBadge}>
            <Text style={styles.billableText}>💲 Fakturovatelné</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation]);

  // Vykreslení záhlaví sekce (datum)
  const renderSectionHeader = useCallback(({ section }: { section: { title: string, data: TimeEntry[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.dayTotalWrapper}>
        <Text style={styles.dayTotal}>⏱️ {calculateDayTotal(section.data)}</Text>
      </View>
    </View>
  ), [calculateDayTotal]);

  // Zobrazení chybové zprávy
  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadProject}>
          <Text style={styles.refreshButtonText}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4286f4" />
          <Text style={styles.loadingText}>Načítání projektu...</Text>
        </View>
      ) : !project ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>Projekt nebyl nalezen</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}

            {project.totalTime && (
              <View style={styles.totalTimeWrapper}>
                <Text style={styles.totalTime}>
                  ⏱️ {project.totalTime.hours}h {project.totalTime.minutes}m
                </Text>
              </View>
            )}
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.cardTitle}>Sledování času</Text>

            {isTimerRunningForProject() ? (
              <View style={styles.runningTimerContainer}>
                <Text style={styles.timerRunning}>Časovač běží</Text>
                <Text style={styles.timerStarted}>
                  Začátek: {formatTime(new Date(runningEntry.startTime))}
                </Text>
                {runningEntry.description && (
                  <Text style={styles.timerDescription}>{runningEntry.description}</Text>
                )}
              </View>
            ) : (
              <View>
                {runningEntry && runningEntry.project ? (
                  <Text style={styles.timerWarning}>
                    Již máte spuštěný časovač pro projekt "{runningEntry.project.name}"
                  </Text>
                ) : (
                  <>
                    <TextInput
                      style={styles.descInput}
                      placeholder="Co děláte? (volitelné)"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={handleStartTimer}
                      disabled={startingTimer}
                    >
                      {startingTimer ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.buttonText}>▶️ Spustit časovač</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.entriesContainer}>
            <Text style={styles.sectionMainTitle}>Historie času</Text>

            {!timeEntries || timeEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{fontSize: 32, marginBottom: 8}}>⏱️</Text>
                <Text style={styles.noEntries}>Žádné časové záznamy pro tento projekt</Text>
              </View>
            ) : (
              <SectionList
                sections={groupedEntries}
                keyExtractor={(item, index) => `${item.id || index}`}
                renderItem={renderTimeEntryItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#4286f4"]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={{fontSize: 32, marginBottom: 8}}>⏱️</Text>
                    <Text style={styles.noEntries}>Žádné časové záznamy pro tento projekt</Text>
                  </View>
                }
              />
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4286f4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  totalTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4286f4',
  },
  timerCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  runningTimerContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 12,
  },
  timerRunning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  timerStarted: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timerDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timerWarning: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
  },
  descInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    minHeight: 80,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  entriesContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  noEntries: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  dayTotalWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  entryItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  runningBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  runningText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  entryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  billableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  billableText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ProjectScreen;