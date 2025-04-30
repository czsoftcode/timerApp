// src/screens/ProjectsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getProjects } from '../api/projects';
import { Project } from '../types/api.types';

const ProjectsScreen = () => {
  const navigation = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Chyba při načítání projektů:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4286f4" style={styles.loader} />
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nemáte žádné projekty</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => alert('Tato funkce zatím není implementována')}
          >
            <Text style={styles.buttonText}>Vytvořit projekt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.projectItem}
                onPress={() => navigation.navigate('Project', { id: item.id, name: item.name })}
              >
                <Text style={styles.projectName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => alert('Tato funkce zatím není implementována')}
            >
              <Text style={styles.buttonText}>Vytvořit nový projekt</Text>
            </TouchableOpacity>
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
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  projectItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: '#4286f4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProjectsScreen;