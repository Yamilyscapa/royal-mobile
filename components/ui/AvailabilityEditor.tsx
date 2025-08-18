import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ThemeText, Container } from '../Themed';
import Button from '../Button';
import Colors from '../../constants/Colors';

interface TimeSlot {
  id: string;
  time: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilityEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: DaySchedule) => void;
  initialSchedule?: DaySchedule;
}

// Generate time options from 6:00 AM to 11:00 PM in 1-hour intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 6; hour <= 23; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const timeString = `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
    options.push(timeString);
  }
  return options;
};

const timeOptions = generateTimeOptions();

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialSchedule,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule>(
    initialSchedule || {
      day: 'default',
      isOpen: true,
      timeSlots: [],
    }
  );

  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const addTimeSlots = () => {
    if (selectedTimes.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos un horario');
      return;
    }

    // Filter out times that already exist
    const newTimes = selectedTimes.filter(time => 
      !schedule.timeSlots.some(slot => slot.time === time)
    );

    if (newTimes.length === 0) {
      Alert.alert('Error', 'Todos los horarios seleccionados ya están configurados');
      return;
    }

    const newSlots: TimeSlot[] = newTimes.map(time => ({
      id: Date.now().toString() + Math.random(),
      time: time,
    }));

    setSchedule(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, ...newSlots].sort((a, b) => {
        // Sort by time
        const timeA = new Date(`2000-01-01 ${a.time}`);
        const timeB = new Date(`2000-01-01 ${b.time}`);
        return timeA.getTime() - timeB.getTime();
      }),
    }));

    setSelectedTimes([]);
  };

  const removeTimeSlot = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id),
    }));
  };

  const toggleOpenStatus = () => {
    setSchedule(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  };

  const handleSave = () => {
    if (schedule.timeSlots.length === 0) {
      Alert.alert('Error', 'Debe haber al menos un horario disponible');
      return;
    }
    onSave(schedule);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <ThemeText style={styles.headerTitle}>Editar Horarios</ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeButtonText}>✕</ThemeText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Container>
            <View style={styles.section}>
              <View style={styles.openStatusContainer}>
                <ThemeText style={styles.sectionTitle}>Estado del Día</ThemeText>
                <TouchableOpacity
                  style={[styles.toggleButton, schedule.isOpen ? styles.openToggle : styles.closedToggle]}
                  onPress={toggleOpenStatus}
                >
                  <ThemeText style={styles.toggleText}>
                    {schedule.isOpen ? 'Abierto' : 'Cerrado'}
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </View>

            {schedule.isOpen && (
              <>
                <View style={styles.section}>
                  <ThemeText style={styles.sectionTitle}>Seleccionar Horario</ThemeText>
                  <ThemeText style={styles.sectionSubtitle}>
                    Selecciona horarios disponibles en intervalos de 1 hora
                  </ThemeText>
                  <View style={styles.timeOptionsContainer}>
                    {timeOptions.map((time) => {
                      const isSelected = selectedTimes.includes(time);
                      const isAlreadyAdded = schedule.timeSlots.some(slot => slot.time === time);
                      
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOptionButton,
                            isSelected && styles.timeOptionSelected,
                            isAlreadyAdded && styles.timeOptionDisabled
                          ]}
                          onPress={() => {
                            if (!isAlreadyAdded) {
                              setSelectedTimes(prev => 
                                isSelected 
                                  ? prev.filter(t => t !== time)
                                  : [...prev, time]
                              );
                            }
                          }}
                          disabled={isAlreadyAdded}
                        >
                          <ThemeText style={{
                            ...styles.timeOptionText,
                            ...(isSelected && styles.timeOptionTextSelected),
                            ...(isAlreadyAdded && styles.timeOptionTextDisabled)
                          }}>
                            {time}
                          </ThemeText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedTimes.length > 0 && (
                    <TouchableOpacity 
                      style={styles.addButton} 
                      onPress={addTimeSlots}
                    >
                      <ThemeText style={styles.addButtonText}>
                        Agregar {selectedTimes.length} horario{selectedTimes.length > 1 ? 's' : ''}
                      </ThemeText>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.sectionLast}>
                  <ThemeText style={styles.sectionTitle}>Horarios Configurados</ThemeText>
                  {schedule.timeSlots.length === 0 ? (
                    <ThemeText style={styles.noSlotsText}>
                      No hay horarios configurados. Selecciona horarios de la lista arriba.
                    </ThemeText>
                  ) : (
                    <View style={styles.timeSlotsContainer}>
                      {schedule.timeSlots.map((slot) => (
                        <View key={slot.id} style={styles.timeSlotItem}>
                          <ThemeText style={styles.timeSlotText}>{slot.time}</ThemeText>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeTimeSlot(slot.id)}
                          >
                            <ThemeText style={styles.removeButtonText}>✕</ThemeText>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </Container>
        </ScrollView>

        <View style={styles.footer}>
          <Button secondary onPress={onClose} style={styles.cancelButton}>
            Cancelar
          </Button>
          <Button onPress={handleSave} style={styles.saveButton}>
            Guardar
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  sectionLast: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.dark.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 15,
  },
  openStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openToggle: {
    backgroundColor: '#34c759',
  },
  closedToggle: {
    backgroundColor: '#ff3b30',
  },
  toggleText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  timeOptionButton: {
    backgroundColor: Colors.dark.gray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeOptionSelected: {
    backgroundColor: Colors.dark.primary,
  },
  timeOptionDisabled: {
    backgroundColor: Colors.dark.gray,
    opacity: 0.5,
    borderColor: Colors.dark.textLight,
  },
  timeOptionText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  timeOptionTextDisabled: {
    color: Colors.dark.textLight,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSlotsText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  timeSlotText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    height: 150,
    flexDirection: 'column',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.gray,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default AvailabilityEditor; 