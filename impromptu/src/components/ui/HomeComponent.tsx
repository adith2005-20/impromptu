"use client";
import React from "react";
import PlaceholderCarousel from "./PlaceholderCarousel"; // optional
import { Textarea } from "./textarea";
import { Button } from "./button";
import { SendIcon } from "lucide-react";

const HomeComponent = () => {
  return (
    <div className="text-foreground w-full min-h-screen flex items-center justify-center">
      <div className="relative w-1/2">
        <Textarea 
          className="w-full pr-16 resize-none h-36" 
          placeholder="Generate a schedule..."
        />
        <Button 
          size="icon" 
          className="absolute right-3 top-3 bg-primary text-white p-2 rounded-full"
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default HomeComponent;