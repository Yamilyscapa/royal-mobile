import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ThemeText, Container } from '../Themed';
import Button from '../Button';
import Colors from '../../constants/Colors';
import { ServiceInterface } from '../../constants/services';

interface ServiceEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: ServiceInterface) => void;
  initialService?: ServiceInterface;
  category: 'barber' | 'spa';
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialService,
  category,
}) => {
  const [service, setService] = useState<ServiceInterface>(
    initialService || {
      name: '',
      price: 0,
      duration: 30,
      description: '',
    }
  );

  const updateService = (field: keyof ServiceInterface, value: any) => {
    setService(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!service.name.trim()) {
      Alert.alert('Error', 'El nombre del servicio es requerido');
      return;
    }

    if (service.price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    if (!service.duration || service.duration <= 0) {
      Alert.alert('Error', 'La duración debe ser mayor a 0');
      return;
    }

    if (!service.description || service.description.trim() === '') {
      Alert.alert('Error', 'Debe ingresar una descripción');
      return;
    }

    onSave(service);
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
          <ThemeText style={styles.headerTitle}>
            {initialService ? 'Editar Servicio' : 'Nuevo Servicio'}
          </ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeButtonText}>✕</ThemeText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Container>
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Información Básica</ThemeText>
              
              <View style={styles.inputGroup}>
                <ThemeText style={styles.label}>Nombre del Servicio</ThemeText>
                <TextInput
                  style={styles.textInput}
                  value={service.name}
                  onChangeText={(text) => updateService('name', text)}
                  placeholder="Ej: Corte Royal"
                  placeholderTextColor={Colors.dark.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemeText style={styles.label}>Precio ($)</ThemeText>
                <TextInput
                  style={styles.textInput}
                  value={service.price.toString()}
                  onChangeText={(text) => updateService('price', parseFloat(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={Colors.dark.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemeText style={styles.label}>Duración (minutos)</ThemeText>
                <TextInput
                  style={styles.textInput}
                  value={service.duration?.toString() || ''}
                  onChangeText={text => updateService('duration', parseInt(text.replace(/[^0-9]/g, '')) || 0)}
                  placeholder="30"
                  placeholderTextColor={Colors.dark.textLight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Descripción del Servicio</ThemeText>
              
              <View style={styles.writtenDescriptionContainer}>
                <TextInput
                  style={styles.writtenDescriptionInput}
                  value={service.description}
                  onChangeText={(text) => updateService('description', text)}
                  placeholder="Describe detalladamente el servicio que ofreces..."
                  placeholderTextColor={Colors.dark.textLight}
                  multiline
                  textAlignVertical="top"
                />
              </View>


            </View>
          </Container>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={handleSave} style={styles.saveButton}>Guardar</Button>
          <Button secondary onPress={onClose} style={styles.cancelButton}>Cancelar</Button>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.dark.text,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.dark.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.background,
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
    width: '100%',
    height: 48,
    borderRadius: 10,
    marginRight: 8,
  },
  saveButton: {
    width: '100%',
    height: 48,
    borderRadius: 10,
  },
  descriptionModeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    paddingVertical: 5,
  },
  modeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  modeButtonTextActive: {
    color: Colors.dark.background,
  },
  writtenDescriptionContainer: {
    marginBottom: 20,
  },
  writtenDescriptionInput: {
    borderWidth: 1,
    borderColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: Colors.dark.background,
  },
});

export default ServiceEditor; 