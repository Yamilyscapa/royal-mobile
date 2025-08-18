import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, SafeAreaView } from "react-native"

// You'll need to install: npm install react-native-calendars
import { Calendar } from "react-native-calendars"
import Colors from "@/constants/Colors"
import Button from "@/components/Button"
import { SchedulesService } from '@/services'

// Generate available hours (9 AM to 5 PM)
const availableHours = Array.from({ length: 9 }, (_, i) => {
  const hour = i + 9
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour
  return {
    value: hour.toString(),
    label: `${displayHour}:00 ${period}`,
  }
})

interface DatePickerProps {
  barberId: string
  onDateSelect?: (date: string) => void
  onTimeSelect?: (time: string) => void
  onConfirm?: (date: string, time: string) => void
  selectedDate?: string
  selectedTime?: string
  showConfirmButton?: boolean
  confirmButtonText?: string
  title?: string
  subtitle?: string
}

export default function DatePicker({
  barberId,
  onDateSelect,
  onTimeSelect,
  onConfirm,
  selectedDate: externalSelectedDate,
  selectedTime: externalSelectedTime,
  showConfirmButton = true,
  confirmButtonText = "Confirmar Cita",
  title = "Seleccionar Fecha y Hora",
  subtitle = "Elige la fecha y hora de tu cita"
}: DatePickerProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>("")
  const [internalSelectedHour, setInternalSelectedHour] = useState<string>("")
  const [isCalendarVisible, setIsCalendarVisible] = useState(false)
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)

  // Use external state if provided, otherwise use internal state
  const selectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate
  const selectedHour = externalSelectedTime !== undefined ? externalSelectedTime : internalSelectedHour

  const today = new Date().toISOString().split("T")[0];

  // Fetch available slots when date or barber changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!barberId || !selectedDate) {
        setAvailableSlots([])
        return
      }
      setIsLoadingTimes(true)
      try {
        const response = await SchedulesService.getAvailability(barberId, selectedDate)
        if (response.success && response.data) {
          let slots = response.data.availableSlots.map(slot => slot.time)
                    // Normalize dates to YYYY-MM-DD for comparison (no Date object, just string)
          const normalizeDate = (dateStr: string) => {
            if (!dateStr) return '';
            // Accepts 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'
            if (dateStr.length >= 10) {
              return dateStr.slice(0, 10);
            }
            return dateStr;
          }
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const todayString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const selectedString = normalizeDate(selectedDate);
          // Always run filtering for any selected date
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const filteredSlots = slots.filter(time => {
            let cleanTime = time.trim();
            if (cleanTime.length === 8 && cleanTime[5] === ':') {
              // Format is HH:mm:ss, convert to HH:mm
              cleanTime = cleanTime.slice(0, 5);
            }
            const [hours, minutes] = cleanTime.split(':').map(Number);
            const slotTimeInMinutes = hours * 60 + minutes;
            // For today, filter out past slots; for other days, show all
            const isToday = selectedString === todayString;
            const keep = isToday ? slotTimeInMinutes > nowMinutes : true;
            return keep;
          });
          setAvailableSlots(filteredSlots);
        } else {
          setAvailableSlots([])
        }
      } catch (error) {
        setAvailableSlots([])
      } finally {
        setIsLoadingTimes(false)
      }
    }
    fetchAvailability()
  }, [barberId, selectedDate])

  const handleDateSelect = (day: any) => {
    const newDate = day.dateString
    if (externalSelectedDate === undefined) {
      setInternalSelectedDate(newDate)
    }
    onDateSelect?.(newDate)
    setIsCalendarVisible(false)
    // Reset hour selection when date changes
    if (externalSelectedTime === undefined) {
      setInternalSelectedHour("")
    }
    onTimeSelect?.("")
  }

  const handleTimeSelect = (hour: string) => {
    if (externalSelectedTime === undefined) {
      setInternalSelectedHour(hour)
    }
    onTimeSelect?.(hour)
    setIsTimePickerVisible(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Seleccionar Fecha";
    // Parse manually to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSelectedTimeLabel = () => {
    if (!selectedHour) return "Seleccionar Hora"
    return selectedHour
  }

  const handleConfirm = () => {
    if (selectedDate && selectedHour) {
      if (onConfirm) {
        onConfirm(selectedDate, selectedHour)
      } else {
        Alert.alert(
          "¡Cita Confirmada!",
          `Tu cita está programada para ${formatDate(selectedDate)} a las ${selectedHour}`,
          [{ text: "OK" }],
        )
      }
    }
  }

  const isAppointmentReady = selectedDate && selectedHour

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Seleccionar Fecha</Text>
        <Button
          onPress={() => setIsCalendarVisible(true)}
          style={styles.button}
          secondary={!selectedDate}
        >
          📅 {formatDate(selectedDate)}
        </Button>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Seleccionar Hora</Text>
        <Button
          onPress={() => selectedDate && setIsTimePickerVisible(true)}
          style={styles.button}
          secondary={!selectedHour}
          disabled={!selectedDate || isLoadingTimes}
        >
          {isLoadingTimes ? (
            <>Cargando horarios...</>
          ) : (
            <>🕐 {getSelectedTimeLabel()}</>
          )}
        </Button>
      </View>

      {/* Appointment Summary */}
      {isAppointmentReady && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen de la Cita</Text>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Fecha: </Text>
            {formatDate(selectedDate)}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Hora: </Text>
            {getSelectedTimeLabel()}
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      {showConfirmButton && (
        <Button
          onPress={handleConfirm}
          disabled={!isAppointmentReady}
          style={styles.confirmButton}
        >
          {confirmButtonText}
        </Button>
      )}

      {/* Calendar Modal */}
      <Modal visible={isCalendarVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsCalendarVisible(false)}>
              <Text style={styles.modalCloseButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            <View style={styles.modalSpacer} />
          </View>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: Colors.dark.tint,
              },
            }}
            minDate={today}
            theme={{
              selectedDayBackgroundColor: Colors.dark.tint,
              selectedDayTextColor: "#ffffff",
              todayTextColor: Colors.dark.tint,
              dayTextColor: Colors.dark.text,
              textDisabledColor: Colors.dark.textLight,
              arrowColor: Colors.dark.tint,
              monthTextColor: Colors.dark.text,
              indicatorColor: Colors.dark.tint,
              backgroundColor: Colors.dark.background,
              calendarBackground: Colors.dark.background,
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={isTimePickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
              <Text style={styles.modalCloseButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Hora</Text>
            <View style={styles.modalSpacer} />
          </View>
          <ScrollView style={styles.timeList}>
            {availableSlots.length > 0 ? (
              availableSlots.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.timeItem, selectedHour === hour && styles.timeItemSelected]}
                  onPress={() => handleTimeSelect(hour)}
                >
                  <Text style={[styles.timeItemText, selectedHour === hour && styles.timeItemTextSelected]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noTimesContainer}>
                <Text style={styles.noTimesText}>
                  No hay horarios disponibles para esta fecha
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
  summary: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: "600",
  },
  confirmButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  modalCloseButton: {
    fontSize: 16,
    color: Colors.dark.tint,
  },
  modalSpacer: {
    width: 50,
  },
  timeList: {
    flex: 1,
  },
  timeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  timeItemSelected: {
    backgroundColor: Colors.dark.tint,
  },
  timeItemText: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: "center",
  },
  timeItemTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  noTimesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noTimesText: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
})
