"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { CommandItem } from './CommandItems';

interface CommandsListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export interface CommandsListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const CommandsList = forwardRef<CommandsListRef, CommandsListProps>((props: any, ref: any) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev: any) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev: any) => (prev + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
        No matching blocks
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 w-72 max-h-80 overflow-y-auto">
      {props.items.map((item: any, index: any) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-400 truncate">{item.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

CommandsList.displayName = 'CommandsList';

export default CommandsList;