// src/components/InactivityMonitor.tsx
import React, { useEffect } from 'react';
import { Text, Modal, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface InactivityMonitorProps {
  warningThreshold?: number; // Čas v ms, kdy se zobrazí varování o blížícím se odhlášení
}

/**
 * Komponenta pro zobrazení varování před automatickým odhlášením
 */
const InactivityMonitor: React.FC<InactivityMonitorProps> = ({
  warningThreshold = 55 * 60 * 1000 // Výchozí hodnota: 55 minut (5 minut před odhlášením)
}) => {
  const { user, resetInactivityTimer } = useAuth();
  const [showWarning, setShowWarning] = React.useState(false);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    // Nastavení časovače pro zobrazení varování
    const warningTimer = setTimeout(() => {
      setShowWarning(true);
    }, warningThreshold);

    return () => {
      clearTimeout(warningTimer);
      setShowWarning(false);
    };
  }, [user, warningThreshold]);

  // Funkce pro prodloužení session
  const extendSession = () => {
    resetInactivityTimer();
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <Modal
      transparent
      visible={showWarning}
      animationType="fade"
      onRequestClose={extendSession}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Upozornění na neaktivitu</Text>
          <Text style={styles.message}>
            Vaše relace se automaticky ukončí za 5 minut z důvodu neaktivity.
          </Text>
          <Text style={styles.message}>
            Chcete-li pokračovat v práci, klepněte kamkoli na obrazovku.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default InactivityMonitor;