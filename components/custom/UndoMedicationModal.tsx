import React from "react";
import { Modal, View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";

interface UndoMedicationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UndoMedicationModal: React.FC<UndoMedicationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl p-6 w-[90%] max-w-sm">
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Untake medication
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            Removing might also reset today's rewards and streak progress. Are
            you sure you want to continue?
          </Text>
          <View className="flex-col justify-end gap-4">
            <Button
              variant="secondary"
              onPress={onCancel}
              className="px-4 py-2"
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="destructive"
              onPress={onConfirm}
              className="px-4 py-2"
            >
              <Text>Undo</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UndoMedicationModal;
