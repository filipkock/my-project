import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
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

const DAYS_TO_SHOW = 30;
const SCROLL_THRESHOLD = 0.8;
const DAY_PILL_WIDTH = 50;
const DAY_PILL_HEIGHT = 60;

interface HorizontalDayScrollerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function HorizontalDayScroller({
  selectedDate,
  onSelectDate,
}: HorizontalDayScrollerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [days, setDays] = useState<DayInfo[]>(() => {
    const startDate = moment(selectedDate).subtract(DAYS_TO_SHOW / 2, "days");
    return generateDaysRange(
      startDate,
      DAYS_TO_SHOW,
      selectedDate,
      moment(selectedDate).format("YYYY-MM")
    );
  });
  const [containerWidth, setContainerWidth] = useState(0);
  const todayButtonOpacity = useSharedValue(1);
  const todayButtonScale = useSharedValue(1);

  useEffect(() => {
    const today = getTodayString();
    const todayIndex = getTodayIndex(days);
    
    if (todayIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        x: todayIndex * DAY_PILL_WIDTH,
        animated: false,
      });
      onSelectDate(today);
    }
  }, []);

  const loadMoreDays = useCallback((direction: "start" | "end") => {
    setDays((currentDays) => {
      const newDays = [...currentDays];
      const startDate = direction === "start"
        ? moment(currentDays[0].date).subtract(DAYS_TO_SHOW / 2, "days")
        : moment(currentDays[currentDays.length - 1].date).add(1, "days");

      const additionalDays = generateDaysRange(
        startDate,
        DAYS_TO_SHOW / 2,
        selectedDate,
        moment(selectedDate).format("YYYY-MM"),
        direction === "start" ? 0 : currentDays.length
      );

      if (direction === "start") {
        newDays.unshift(...additionalDays);
      } else {
        newDays.push(...additionalDays);
      }

      return newDays;
    });
  }, [selectedDate]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.x;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    const scrollPercentage = scrollPosition / maxScroll;

    if (scrollPercentage < 1 - SCROLL_THRESHOLD) {
      loadMoreDays("start");
    } else if (scrollPercentage > SCROLL_THRESHOLD) {
      loadMoreDays("end");
    }
  }, [loadMoreDays]);

  const scrollToToday = useCallback(() => {
    const today = getTodayString();
    const todayIndex = getTodayIndex(days);
    
    if (todayIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        x: todayIndex * DAY_PILL_WIDTH,
        animated: true,
      });
      onSelectDate(today);
    }
  }, [days, onSelectDate]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

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

  const getPillStyles = (day: DayInfo) => {
    const isSelected = day.date === selectedDate;
    const isToday = day.date === getTodayString();

    return cn(
      "w-[50px] h-[60px] rounded-[20px] mx-1 items-center justify-center p-2",
      isSelected && "bg-black dark:bg-white",
      isToday && !isSelected && "bg-transparent border-2 border-black dark:border-white",
      !isSelected && !isToday && "bg-transparent border border-border"
    );
  };

  const getTextStyles = (day: DayInfo, isDayName = false) => {
    const isSelected = day.date === selectedDate;
    const isToday = day.date === getTodayString();

    return cn(
      isDayName ? "text-xs mb-1" : "text-base font-semibold",
      isSelected && "text-white dark:text-black",
      isToday && !isSelected && "text-black dark:text-white",
      !isSelected && !isToday && "text-muted-foreground"
    );
  };

  return (
    <View className="py-2" onLayout={handleContainerLayout}>
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

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="px-2"
        decelerationRate="fast"
        snapToInterval={DAY_PILL_WIDTH}
        snapToAlignment="center"
      >
        {days.map((day) => (
          <TouchableOpacity
            key={day.date}
            className={getPillStyles(day)}
            onPress={() => onSelectDate(day.date)}
            activeOpacity={0.7}
          >
            <Text className={getTextStyles(day, true)}>
              {day.day}
            </Text>
            <Text className={getTextStyles(day)}>
              {day.dateNum}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 