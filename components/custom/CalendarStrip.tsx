import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import moment from 'moment';
import { useTheme } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markedDates?: { [date: string]: { marked: boolean; dots: { key: string; color: string }[] } };
}

export default function CalendarStrip({ selectedDate, onSelectDate, markedDates = {} }: CalendarStripProps) {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(moment());
  const today = moment();
  
  // Generate days for the current month
  const days = Array.from(
    { length: currentMonth.daysInMonth() }, 
    (_, i) => currentMonth.clone().startOf('month').add(i, 'days')
  );

  const handlePrevMonth = () => {
    setCurrentMonth(prev => prev.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => prev.clone().add(1, 'month'));
  };

  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between px-4 mb-2">
        <TouchableOpacity onPress={handlePrevMonth}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-medium">
          {currentMonth.format('MMMM YYYY')}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-2"
      >
        {days.map((day) => {
          const dateString = day.format('YYYY-MM-DD');
          const isSelected = dateString === selectedDate;
          const isMarked = markedDates[dateString]?.marked;
          const isToday = day.isSame(today, 'day');
          
          return (
            <TouchableOpacity
              key={dateString}
              onPress={() => onSelectDate(dateString)}
              className={`mx-1 items-center justify-center rounded-lg p-2 ${
                isSelected ? 'bg-primary' : isToday ? 'bg-primary/10' : 'bg-card'
              }`}
              style={{ width: 45 }}
            >
              <Text 
                className={`text-xs font-medium ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {day.format('ddd')}
              </Text>
              <Text 
                className={`text-base font-bold ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {day.format('D')}
              </Text>
              {isMarked && (
                <View className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
} 