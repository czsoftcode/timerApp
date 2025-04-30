// src/screens/ProjectScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
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
  const [startingTimer, setStartingTimer] = useState(false);
  const [description, setDescription] = useState('');

  // Získáme ID projektu z navigačních parametrů
  const projectId = route.params?.id;

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);

      // Časové záznamy by měly být součástí odpovědi z API
      if (data.timeEntries) {
        setTimeEntries(data.timeEntries);
      }
    } catch (error) {
      console.error('Chyba při načítání projektu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (startingTimer || !projectId) return;

    try {
      setStartingTimer(true);
      await startTimer(projectId, description);
      setDescription('');

      // Aktualizujeme informace o projektu
      await loadProject();
    } catch (error) {
      console.error('Chyba při spouštění časovače:', error);
    } finally {
      setStartingTimer(false);
    }
  };

  const isTimerRunningForProject = () => {
    return runningEntry && runningEntry.project.id === projectId;
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4286f4" style={styles.loader} />
      ) : !project ? (
        <Text style={styles.errorText}>Projekt nebyl nalezen</Text>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}

            {project.totalTime && (
              <Text style={styles.totalTime}>
                Celkový čas: {project.totalTime.hours}h {project.totalTime.minutes}m
              </Text>
            )}
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.cardTitle}>Sledování času</Text>

            {isTimerRunningForProject() ? (
              <View>
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
                {runningEntry ? (
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
                        <Text style={styles.buttonText}>Spustit časovač</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Časové záznamy</Text>

          {timeEntries.length === 0 ? (
            <Text style={styles.noEntries}>Žádné časové záznamy pro tento projekt</Text>
          ) : (
            <FlatList
              data={timeEntries}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.entryItem}
                  onPress={() => navigation.navigate('TimeEntry', { id: item.id })}
                >
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{formatDate(new Date(item.startTime))}</Text>
                    {item.endTime ? (
                      <Text style={styles.entryDuration}>
                        {item.durationInHours?.toFixed(2)} h
                      </Text>
                    ) : (
                      <Text style={styles.entryRunning}>Běží</Text>
                    )}
                  </View>

                  <Text style={styles.entryTime}>
                    {formatTime(new Date(item.startTime))}
                    {item.endTime ? ` - ${formatTime(new Date(item.endTime))}` : ''}
                  </Text>

                  {item.description && (
                    <Text style={styles.entryDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
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
  totalTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4286f4',
    marginTop: 4,
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  noEntries: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  entryItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  entryRunning: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  entryTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 14,
    color: '#333',
  },
});

export default ProjectScreen;