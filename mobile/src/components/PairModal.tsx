import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemeColors } from '../theme/colors';

interface PairModalProps {
  colors: ThemeColors;
  visible: boolean;
  tvName: string;
  onPair: (code: string) => void;
  onCancel: () => void;
}

export const PairModal: React.FC<PairModalProps> = ({
  colors,
  visible,
  tvName,
  onPair,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handlePair = () => {
    const trimmed = code.trim().toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(trimmed)) {
      setError('Enter all 6 characters (0–9 and A–F).');
      return;
    }
    setError('');
    onPair(trimmed);
    setCode('');
  };

  const handleClose = () => {
    setError('');
    setCode('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrim}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.ink }]}>
            Pair with {tvName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mute }]}>
            Enter the 6-character code shown on your TV.
          </Text>

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.key2,
                color: colors.ink,
                borderColor: error ? colors.red : 'transparent',
              },
            ]}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              if (error) setError('');
            }}
            placeholder="••••••"
            placeholderTextColor={colors.mute}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={handlePair}
            autoFocus
          />

          {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.acc }]}
              activeOpacity={0.8}
              onPress={handlePair}
            >
              <Text style={[styles.btnText, { color: colors.accink }]}>Pair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.key2 }]}
              activeOpacity={0.8}
              onPress={handleClose}
            >
              <Text style={[styles.btnText, { color: colors.ink }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: -4,
  },
  codeInput: {
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    marginVertical: 4,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },
  buttonRow: {
    gap: 10,
    marginTop: 6,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

