import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Dimensions,
} from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import moment from "moment";
import {
  DayInfo,
  generateDaysRange,
  formatMonthLabel,
  getTodayString,
  getCurrentMonth,
  getTodayIndex,
  getDateIndex,
} from "~/src/utils/dateUtils";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";

const DAY_PILL_WIDTH = 50;
const DAY_PILL_HEIGHT = 60;
const WINDOW_WIDTH = Dimensions.get("window").width;
const DAYS_BEFORE = 14; // 2 weeks before
const DAYS_AFTER = 42; // 6 weeks ahead
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1; // +1 for today

interface HorizontalDayScrollerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DayPill = React.memo(({ 
  day, 
  isSelected, 
  isToday, 
  onPress 
}: { 
  day: DayInfo; 
  isSelected: boolean; 
  isToday: boolean; 
  onPress: () => void;
}) => {
  const getPillStyles = () => {
    return cn(
      "w-[50px] h-[60px] rounded-[20px] mx-1 items-center justify-center p-2",
      isSelected && "bg-black dark:bg-white",
      isToday && !isSelected && "bg-transparent border-2 border-black dark:border-white",
      !isSelected && !isToday && "bg-transparent border border-border"
    );
  };

  const getTextStyles = (isDayName = false) => {
    return cn(
      isDayName ? "text-xs mb-1" : "text-base font-semibold",
      isSelected && "text-white dark:text-black",
      isToday && !isSelected && "text-black dark:text-white",
      !isSelected && !isToday && "text-muted-foreground"
    );
  };

  return (
    <TouchableOpacity
      className={getPillStyles()}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className={getTextStyles(true)}>
        {day.day}
      </Text>
      <Text className={getTextStyles()}>
        {day.dateNum}
      </Text>
    </TouchableOpacity>
  );
});

export default function HorizontalDayScroller({
  selectedDate,
  onSelectDate,
}: HorizontalDayScrollerProps) {
  const flatListRef = useRef<FlatList>(null);
  const todayButtonOpacity = useSharedValue(1);
  const todayButtonScale = useSharedValue(1);

  // Generate all days once and memoize
  const days = useMemo(() => {
    const startDate = moment().subtract(DAYS_BEFORE, "days");
    return generateDaysRange(
      startDate,
      TOTAL_DAYS,
      selectedDate,
      moment(selectedDate).format("YYYY-MM")
    );
  }, [selectedDate]);

  // Calculate today's index once
  const todayIndex = useMemo(() => {
    return getTodayIndex(days);
  }, [days]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (todayIndex !== -1) {
      flatListRef.current?.scrollToIndex({
        index: todayIndex,
        animated: false,
        viewPosition: 0.5,
      });
    }
  }, [todayIndex]);

  const scrollToToday = useCallback(() => {
    if (todayIndex !== -1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: todayIndex,
        animated: true,
        viewPosition: 0.5,
      });
      onSelectDate(getTodayString());
    }
  }, [todayIndex, onSelectDate]);

  const isTodaySelected = selectedDate === getTodayString();

  useEffect(() => {
    todayButtonOpacity.value = withTiming(isTodaySelected ? 0 : 1, { duration: 200 });
    todayButtonScale.value = withSpring(isTodaySelected ? 0.8 : 1);
  }, [isTodaySelected]);

  const todayButtonStyle = useAnimatedStyle(() => ({
    opacity: todayButtonOpacity.value,
    transform: [{ scale: todayButtonScale.value }],
  }));

  const formatSelectedDate = (date: string) => {
    return moment(date).format("D MMMM");
  };

  const handleDayPress = useCallback((day: DayInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(day.date);
  }, [onSelectDate]);

  const renderDay = useCallback(({ item: day }: { item: DayInfo }) => {
    const isSelected = day.date === selectedDate;
    const isToday = day.date === getTodayString();

    return (
      <DayPill
        day={day}
        isSelected={isSelected}
        isToday={isToday}
        onPress={() => handleDayPress(day)}
      />
    );
  }, [selectedDate, handleDayPress]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: DAY_PILL_WIDTH,
    offset: DAY_PILL_WIDTH * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: DayInfo) => item.date, []);

  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold text-foreground">
            {formatSelectedDate(selectedDate)}
          </Text>
        </View>
        <Animated.View 
          style={[todayButtonStyle]}
          className="absolute right-4"
        >
          <Button
            variant="outline"
            size="sm"
            onPress={scrollToToday}
            className="ml-2"
          >
            <Text>Today</Text>
          </Button>
        </Animated.View>
      </View>

      <FlatList
        ref={flatListRef}
        data={days}
        renderItem={renderDay}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        decelerationRate="fast"
        snapToInterval={DAY_PILL_WIDTH}
        snapToAlignment="center"
        getItemLayout={getItemLayout}
        keyExtractor={keyExtractor}
        initialScrollIndex={todayIndex}
        removeClippedSubviews={true}
        maxToRenderPerBatch={7}
        windowSize={5}
        onScrollToIndexFailed={() => {
          // Fallback to scrolling to the middle of the list
          flatListRef.current?.scrollToIndex({
            index: Math.floor(days.length / 2),
            animated: false,
          });
        }}
      />
    </View>
  );
} 