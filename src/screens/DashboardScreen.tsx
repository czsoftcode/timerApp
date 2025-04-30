// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEntry } from '../contexts/TimeEntryContext';
import { getProjects } from '../api/projects';
import { getTimeEntries } from '../api/timeEntries';
import { Project, TimeEntry } from '../types/api.types';
import { formatDuration, formatTime } from '../utils/formatters';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { runningEntry, stopTimer, loading: timerLoading } = useTimeEntry();

  const [projects, setProjects] = useState<Project[]>([]);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingProjects(true);
      setLoadingEntries(true);

      // Načtení projektů
      const projectsData = await getProjects();
      setProjects(projectsData);

      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }

      // Načtení posledních časových záznamů
      const entriesData = await getTimeEntries();
      setRecentEntries(entriesData.slice(0, 5)); // Pouze 5 nejnovějších

    } catch (error) {
      console.error('Chyba při načítání dat:', error);
    } finally {
      setLoadingProjects(false);
      setLoadingEntries(false);
    }
  };

  const handleStopTimer = async () => {
    if (runningEntry) {
      try {
        await stopTimer(runningEntry.id);
        loadData(); // Obnovíme data po zastavení časovače
      } catch (error) {
        console.error('Chyba při zastavení časovače:', error);
      }
    }
  };

  const getTodayEntries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recentEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  };

  const calculateTodayDuration = () => {
    const todayEntries = getTodayEntries();
    let totalSeconds = 0;

    todayEntries.forEach(entry => {
      if (entry.endTime) {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        totalSeconds += (end.getTime() - start.getTime()) / 1000;
      }
    });

    return formatDuration(totalSeconds);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Ahoj, {user?.firstName || user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aktuální časovač</Text>

        {timerLoading ? (
          <ActivityIndicator size="small" color="#4286f4" />
        ) : runningEntry ? (
          <View>
            <Text style={styles.projectName}>{runningEntry.project.name}</Text>
            <Text style={styles.timeInfo}>
              Začátek: {formatTime(new Date(runningEntry.startTime))}
            </Text>
            {runningEntry.description && (
              <Text style={styles.description}>{runningEntry.description}</Text>
            )}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopTimer}
            >
              <Text style={styles.buttonText}>Zastavit časovač</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.noTimer}>Žádný časovač neběží</Text>

            {loadingProjects ? (
              <ActivityIndicator size="small" color="#4286f4" />
            ) : projects.length > 0 ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Projects')}
              >
                <Text style={styles.buttonText}>Spustit nový časovač</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.noProjects}>Nemáte žádné projekty</Text>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('Projects')}
                >
                  <Text style={styles.buttonText}>Vytvořit projekt</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dnešní souhrn</Text>

        {loadingEntries ? (
          <ActivityIndicator size="small" color="#4286f4" />
        ) : (
          <View>
            <Text style={styles.todayTime}>{calculateTodayDuration()}</Text>

            {getTodayEntries().length === 0 ? (
              <Text style={styles.noEntries}>Dnes jste zatím neměřili žádný čas</Text>
            ) : (
              getTodayEntries().map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryItem}
                  onPress={() => navigation.navigate('TimeEntry', { id: entry.id })}
                >
                  <Text style={styles.entryProject}>{entry.project.name}</Text>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryTime}>
                      {formatTime(new Date(entry.startTime))}
                      {entry.endTime ? ` - ${formatTime(new Date(entry.endTime))}` : ' (běží)'}
                    </Text>
                    {entry.endTime && (
                      <Text style={styles.entryDuration}>
                        {entry.durationInHours?.toFixed(2)} h
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nedávné projekty</Text>

        {loadingProjects ? (
          <ActivityIndicator size="small" color="#4286f4" />
        ) : projects.length === 0 ? (
          <Text style={styles.noProjects}>Nemáte žádné projekty</Text>
        ) : (
          projects.slice(0, 3).map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectItem}
              onPress={() => navigation.navigate('Project', { id: project.id, name: project.name })}
            >
              <Text style={styles.projectItemName}>{project.name}</Text>
              {project.description && (
                <Text numberOfLines={1} style={styles.projectItemDesc}>
                  {project.description}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Projects')}
        >
          <Text style={styles.viewAllText}>Zobrazit všechny projekty</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
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
  noTimer: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  stopButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  todayTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  noEntries: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  entryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    marginBottom: 4,
  },
  entryProject: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: 14,
    color: '#666',
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noProjects: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  projectItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  projectItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  projectItemDesc: {
    fontSize: 14,
    color: '#666',
  },
  viewAllButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4286f4',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;