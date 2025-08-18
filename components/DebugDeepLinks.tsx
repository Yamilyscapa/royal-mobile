import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { performanceMonitor } from '@/helpers/performance';
import { apiClient } from '@/services/api';

interface PerformanceMetrics {
  [key: string]: {
    count: number;
    average: string;
    min: string;
    max: string;
    total: string;
  };
}

export default function DebugDeepLinks() {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({});
  const [slowOperations, setSlowOperations] = useState<Array<{id: string, duration: number}>>([]);

  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceMetrics(performanceMonitor.getSummary());
      setSlowOperations(performanceMonitor.getSlowOperations(1000)); // Show operations slower than 1 second
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const clearMetrics = () => {
    // Clear old metrics
    performanceMonitor.clearOldMetrics();
    setPerformanceMetrics({});
    setSlowOperations([]);
  };

  const getApiPerformance = () => {
    return apiClient.getPerformanceSummary();
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Panel</Text>
      
      <ScrollView style={styles.scrollView}>
        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
          {Object.keys(performanceMetrics).length > 0 ? (
            Object.entries(performanceMetrics).map(([operation, metrics]) => (
              <View key={operation} style={styles.metricItem}>
                <Text style={styles.operationName}>{operation}</Text>
                <Text style={styles.metricText}>Count: {metrics.count}</Text>
                <Text style={styles.metricText}>Avg: {metrics.average}ms</Text>
                <Text style={styles.metricText}>Min: {metrics.min}ms</Text>
                <Text style={styles.metricText}>Max: {metrics.max}ms</Text>
                <Text style={styles.metricText}>Total: {metrics.total}ms</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>No performance data available</Text>
          )}
        </View>

                 {/* Slow Operations */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>🐌 Slow Operations (&gt;1s)</Text>
          {slowOperations.length > 0 ? (
            slowOperations.map((op) => (
              <View key={op.id} style={styles.slowItem}>
                <Text style={styles.slowId}>{op.id}</Text>
                <Text style={styles.slowDuration}>{op.duration.toFixed(2)}ms</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>No slow operations detected</Text>
          )}
        </View>

        {/* API Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 API Performance</Text>
          <TouchableOpacity style={styles.button} onPress={() => {
            const apiMetrics = getApiPerformance();
          }}>
            <Text style={styles.buttonText}>Log API Metrics to Console</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Actions</Text>
          <TouchableOpacity style={styles.button} onPress={clearMetrics}>
            <Text style={styles.buttonText}>Clear Performance Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  metricItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#3a3a3a',
    borderRadius: 4,
  },
  operationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
  slowItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ff5722',
    borderRadius: 4,
  },
  slowId: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  slowDuration: {
    fontSize: 12,
    color: '#ffffff',
  },
  noData: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 