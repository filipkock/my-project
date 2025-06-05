import React from "react";
import { Modal, Platform, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";

interface DateTimePickerModalProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date | null) => void;
  onRequestClose: () => void;
}

const DateTimePickerModal = ({
  visible,
  value,
  onChange,
  onRequestClose,
}: DateTimePickerModalProps) => {
  const [pickerValue, setPickerValue] = React.useState<Date>(value);

  React.useEffect(() => {
    setPickerValue(value);
  }, [value, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#00000088",
        }}
      >
        <View
          style={{
            margin: 20,
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <Text className="font-bold text-lg mb-4">Select date and time</Text>
          <DateTimePicker
            value={pickerValue}
            mode="datetime"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                if (event.type === "set" && date) {
                  onRequestClose();
                  onChange(date);
                } else if (event.type === "dismissed") {
                  onRequestClose();
                  onChange(null);
                }
              } else {
                if (date) setPickerValue(date);
              }
            }}
            style={{ marginBottom: 20 }}
          />
          {Platform.OS === "ios" && (
            <Button
              className="mb-2"
              onPress={() => {
                onRequestClose();
                onChange(pickerValue);
              }}
            >
              <Text>Done</Text>
            </Button>
          )}
          <Button
            variant="secondary"
            onPress={() => {
              onRequestClose();
              onChange(null);
            }}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default DateTimePickerModal;
