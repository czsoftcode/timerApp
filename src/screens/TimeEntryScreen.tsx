// src/screens/TimeEntryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getTimeEntry, stopTimeEntry, deleteTimeEntry } from '../api/timeEntries';
import { TimeEntry } from '../types/api.types';
import { formatDate, formatTime, formatDuration } from '../utils/formatters';
import { useTimeEntry } from '../contexts/TimeEntryContext';
import { Ionicons } from '@expo/vector-icons';

const TimeEntryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { refreshRunningEntry } = useTimeEntry();

  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Získáme ID časového záznamu z navigačních parametrů
  const entryId = route.params?.id;

  useEffect(() => {
    if (entryId) {
      loadTimeEntry();
    }
  }, [entryId]);

  const loadTimeEntry = async () => {
    try {
      setLoading(true);
      const data = await getTimeEntry(entryId);
      setTimeEntry(data);
    } catch (error) {
      console.error('Chyba při načítání časového záznamu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!timeEntry || stopping) return;

    try {
      setStopping(true);
      await stopTimeEntry(timeEntry.id);

      // Aktualizujeme informace o časovém záznamu a kontrolujeme běžící časovač
      await loadTimeEntry();
      await refreshRunningEntry();
    } catch (error) {
      console.error('Chyba při zastavení časovače:', error);
    } finally {
      setStopping(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!timeEntry || deleting) return;

    Alert.alert(
      'Smazat záznam',
      'Opravdu chcete smazat tento časový záznam?',
      [
        {
          text: 'Zrušit',
          style: 'cancel',
        },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteTimeEntry(timeEntry.id);

              // Po smazání se vrátíme zpět
              navigation.goBack();
            } catch (error) {
              console.error('Chyba při mazání časového záznamu:', error);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShareEntry = async () => {
    if (!timeEntry) return;

    try {
      let duration = 'Stále běží';
      if (timeEntry.endTime) {
        const durationHours = timeEntry.durationInHours || 0;
        duration = `${durationHours.toFixed(2)} hodin`;
      }

      const message = `
Projekt: ${timeEntry.project.name}
Datum: ${formatDate(new Date(timeEntry.startTime))}
Čas: ${formatTime(new Date(timeEntry.startTime))} - ${timeEntry.endTime ? formatTime(new Date(timeEntry.endTime)) : 'běží'}
Trvání: ${duration}
${timeEntry.description ? `Popis: ${timeEntry.description}` : ''}
      `.trim();

      await Share.share({
        message,
        title: `Časový záznam - ${timeEntry.project.name}`,
      });
    } catch (error) {
      console.error('Chyba při sdílení záznamu:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4286f4" />
        <Text style={styles.loadingText}>Načítání časového záznamu...</Text>
      </View>
    );
  }

  if (!timeEntry) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Časový záznam nebyl nalezen</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Zpět</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calculatedCost = timeEntry.endTime && timeEntry.isBillable && timeEntry.rate ?
    (timeEntry.durationInHours || 0) * timeEntry.rate : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.projectName}>{timeEntry.project.name}</Text>
          {!timeEntry.endTime && (
            <View style={styles.runningBadge}>
              <Text style={styles.runningText}>BĚŽÍ</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Datum:</Text>
            <Text style={styles.value}>{formatDate(new Date(timeEntry.startTime))}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Začátek:</Text>
            <Text style={styles.value}>{formatTime(new Date(timeEntry.startTime))}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Konec:</Text>
            <Text style={styles.value}>
              {timeEntry.endTime ? formatTime(new Date(timeEntry.endTime)) : 'Stále běží'}
            </Text>
          </View>

          {timeEntry.endTime && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trvání:</Text>
              <Text style={styles.value}>
                {timeEntry.durationInHours ? `${timeEntry.durationInHours.toFixed(2)} hodin` : '-'}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fakturovatelné:</Text>
            <Text style={styles.value}>
              {timeEntry.isBillable ? 'Ano' : 'Ne'}
            </Text>
          </View>

          {calculatedCost && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cena:</Text>
              <Text style={styles.valueHighlight}>
                {calculatedCost.toFixed(2)} {timeEntry.currency || 'CZK'}
              </Text>
            </View>
          )}
        </View>

        {timeEntry.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Popis:</Text>
            <Text style={styles.description}>{timeEntry.description}</Text>
          </View>
        )}

        <View style={styles.actionSection}>
          {!timeEntry.endTime && (
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={handleStopTimer}
              disabled={stopping}
            >
              {stopping ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Zastavit</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditTimeEntry', { id: timeEntry.id })}
          >
            <Ionicons name="pencil" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Upravit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShareEntry}
          >
            <Ionicons name="share-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Sdílet</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteEntry}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Smazat záznam</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.projectLink}
        onPress={() => navigation.navigate('Project', {
          id: timeEntry.project.id,
          name: timeEntry.project.name
        })}
      >
        <Ionicons name="folder-open-outline" size={20} color="#4286f4" style={styles.linkIcon} />
        <Text style={styles.projectLinkText}>Přejít na projekt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4286f4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  runningBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  runningText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#666',
    fontSize: 16,
  },
  value: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  valueHighlight: {
    flex: 1,
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4286f4',
  },
  descriptionLabel: {
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    fontSize: 16,
  },
  description: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  linkIcon: {
    marginRight: 8,
  },
  projectLinkText: {
    color: '#4286f4',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimeEntryScreen;