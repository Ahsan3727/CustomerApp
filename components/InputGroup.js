import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radius } from '../theme';

export default function InputGroup({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  rightIcon,
}) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.inkMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
      {rightIcon ? (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.rightIconTouch}>
          <Text style={styles.rightIconText}>{rightIcon.icon}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  icon: {
    fontSize: 16,
    color: Colors.inkMuted,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  rightIconTouch: { padding: 4 },
  rightIconText: { fontSize: 18, color: Colors.inkMuted },
});