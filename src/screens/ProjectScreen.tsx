import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const ProjectScreen = ({ navigation, route }) => {
  // Zde bude později načítání dat z API
  const project = {
    id: route.params?.id || 1,
    name: route.params?.name || "Ukázkový projekt",
    description: "Popis projektu bude načten z API",
  };

  // Ukázkové časové záznamy
  const timeEntries = [
    { id: 1, description: "Práce na UI", startTime: "2024-04-30T09:00:00", endTime: "2024-04-30T11:30:00", durationInHours: 2.5 },
    { id: 2, description: "Implementace API", startTime: "2024-04-30T13:00:00", endTime: "2024-04-30T16:45:00", durationInHours: 3.75 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.description}>{project.description}</Text>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.cardTitle}>Spustit časovač</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            // Zde bude později volání API pro spuštění časovače
            alert('Časovač spuštěn');
          }}
        >
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.entriesSection}>
        <Text style={styles.sectionTitle}>Časové záznamy</Text>
        <FlatList
          data={timeEntries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.entryItem}
              onPress={() => navigation.navigate('TimeEntry', { id: item.id })}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryTime}>
                  {new Date(item.startTime).toLocaleTimeString()} -
                  {item.endTime ? new Date(item.endTime).toLocaleTimeString() : 'běží'}
                </Text>
                <Text style={styles.entryDuration}>{item.durationInHours} h</Text>
              </View>
              <Text style={styles.entryDescription}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    color: '#666',
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
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  entriesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryTime: {
    color: '#666',
  },
  entryDuration: {
    fontWeight: 'bold',
    color: '#333',
  },
  entryDescription: {
    color: '#333',
  },
});

export default ProjectScreen;