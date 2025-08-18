import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Colors from '@/constants/Colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'light-content' | 'dark-content';
  style?: any;
  showTopFade?: boolean;
  showBottomFade?: boolean;
  isLoading?: boolean;
}

export default function ScreenWrapper({
  children,
  edges = ['top', 'bottom'],
  statusBarStyle = 'light-content',
  style,
  showTopFade = true,
  showBottomFade = true,
  isLoading = false
}: ScreenWrapperProps) {
  const getMaskColors = () => {
    if (showTopFade && showBottomFade) {
      return ['transparent', 'black', 'black', 'transparent'];
    } else if (showTopFade) {
      return ['transparent', 'black', 'black'];
    } else if (showBottomFade) {
      return ['black', 'black', 'transparent'];
    } else {
      return ['black'];
    }
  };

  const getMaskLocations = () => {
    if (showTopFade && showBottomFade) {
      return [0, 0.08, 0.92, 1];
    } else if (showTopFade) {
      return [0, 0.08, 1];
    } else if (showBottomFade) {
      return [0, 0.92, 1];
    } else {
      return [0];
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: Colors.dark.background }, style]} edges={edges}>
      <StatusBar barStyle={statusBarStyle} />
      <MaskedView
        style={{ flex: 1 }}
        maskElement={
          <LinearGradient
            style={{ flex: 1 }}
            colors={getMaskColors() as any}
            locations={getMaskLocations() as any}
          />
        }
      >
        {children}
      </MaskedView>
    </SafeAreaView>
  );
} 