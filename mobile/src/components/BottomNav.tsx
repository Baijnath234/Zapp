import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { ViewType } from '../types/tv';

interface BottomNavProps {
  colors: ThemeColors;
  currentView: ViewType;
  onSelectView: (view: 'remote' | 'connect') => void;
  insetBottom?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  colors,
  currentView,
  onSelectView,
  insetBottom = 0,
}) => {
  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.key2,
          paddingBottom: Math.max(12, insetBottom + 6),
        },
      ]}
    >
      <View style={styles.navInner}>
        {/* Remote Tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            currentView === 'remote' && { backgroundColor: colors.acc },
          ]}
          activeOpacity={0.8}
          onPress={() => onSelectView('remote')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentView === 'remote' }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: currentView === 'remote' ? colors.accink : colors.mute,
              },
            ]}
          >
            Remote
          </Text>
        </TouchableOpacity>

        {/* Connection Tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            currentView === 'connect' && { backgroundColor: colors.acc },
          ]}
          activeOpacity={0.8}
          onPress={() => onSelectView('connect')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentView === 'connect' }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: currentView === 'connect' ? colors.accink : colors.mute,
              },
            ]}
          >
            Connection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  navInner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    gap: 8,
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

