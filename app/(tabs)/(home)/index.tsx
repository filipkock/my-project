import React, { useState } from "react";
import { View, Keyboard, ScrollView } from "react-native";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/plus";
import { Link, router } from "expo-router";

export default function Screen() {
  const [value, setValue] = useState(""); //current input field
  const [items, setItems] = useState<string[]>([]); //array of saved text

  const handleSave = () => {
    if (value.trim() !== "") {
      // Check to prevent saving empty text
      setItems((prevItems) => [...prevItems, value]);
      setValue(""); // Clear the input field
      Keyboard.dismiss();
    }
  };

  const removeItem = (removedItem: string) => {
    setItems((prevItems) => prevItems.filter((item) => item !== removedItem));
  };

  return (
    <ScrollView>
      <View className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
        <Card className="w-full max-w-sm p-6 rounded-2xl">
          <Input
            placeholder="Input a medication name"
            value={value}
            onChangeText={setValue}
            className="mb-4"
          />
          <Button className="w-full flex flex-row gap-2" onPress={handleSave}>
            <Plus size={22} color="white" />
            <Text>Add</Text>
          </Button>
        </Card>

        {items.length === 0 && (
          <Card className="w-full p-6 rounded-2xl max-w-sm">
            <Text>No items seaved yet</Text>
          </Card>
        )}

        {items.map((item, index) => (
          <Card className="w-full max-w-sm p-6 rounded-2xl" key={index}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
            </CardHeader>
            <Button
              variant={"secondary"}
              className="w-full mb-5"
              onPress={() => removeItem(item)}
            >
              <Text>Remove</Text>
            </Button>
            <Button
              variant={"default"}
              className="w-full"
              onPress={() => router.push(`/details/${item}`)}
            >
              <Text>View details</Text>
            </Button>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
