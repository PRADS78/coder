import { useState } from "react";
import { FieldType } from "@/lib/form-schema";
import { getFieldsByCategory } from "@/lib/field-registry";
import { useDragAndDrop, createDragItem } from "@/hooks/useDragAndDrop";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Type,
  FileText,
  Calendar,
  ChevronDown,
  Paperclip,
  Hash,
  Briefcase,
  Building,
  MapPin,
  Droplets,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./FieldsSidebar.module.scss";

interface FieldsSidebarProps {
  onFieldAdd: (fieldType: FieldType) => void;
}

const FIELD_ICONS: Record<FieldType, React.ComponentType<any>> = {
  "short-text": Type,
  "long-text": FileText,
  "date-picker": Calendar,
  dropdown: ChevronDown,
  "file-upload": Paperclip,
  number: Hash,
  "udf-designation": Briefcase,
  "udf-department": Building,
  "udf-location": MapPin,
  "udf-blood-group": Droplets,
  "udf-education": GraduationCap,
};

export const FieldsSidebar: React.FC<FieldsSidebarProps> = ({ onFieldAdd }) => {
  const [activeTab, setActiveTab] = useState<"input" | "udf">("input");
  const [searchQuery, setSearchQuery] = useState("");

  const { onDragStart, onDragEnd } = useDragAndDrop();

  const inputFields = getFieldsByCategory("input").map((field) => [
    field.type,
    field,
  ]);
  const udfFields = getFieldsByCategory("udf").map((field) => [
    field.type,
    field,
  ]);

  const filteredInputFields = inputFields.filter(([_, config]) =>
    config.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredUdfFields = udfFields.filter(([_, config]) =>
    config.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFieldDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    const dragItem = createDragItem(fieldType, "field-type", { fieldType });
    onDragStart(e, dragItem);
  };

  const renderFieldItem = (
    fieldType: FieldType,
    config: (typeof FIELD_TYPES)[FieldType],
  ) => {
    const IconComponent = FIELD_ICONS[fieldType];

    return (
      <div
        key={fieldType}
        draggable
        onDragStart={(e) => handleFieldDragStart(e, fieldType)}
        onDragEnd={onDragEnd}
        onClick={() => onFieldAdd(fieldType)}
        className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
          <IconComponent className="w-4 h-4 text-gray-600 group-hover:text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Form Fields
        </h2>

        {/* Search */}
        {activeTab === "udf" && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search UDF"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("input")}
            className={cn(
              "flex-1 h-8 text-xs font-medium rounded-md transition-all",
              activeTab === "input"
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            Input Fields
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("udf")}
            className={cn(
              "flex-1 h-8 text-xs font-medium rounded-md transition-all",
              activeTab === "udf"
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            UDF Fields
          </Button>
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {activeTab === "input"
            ? filteredInputFields.map(([fieldType, config]) =>
                renderFieldItem(fieldType as FieldType, config),
              )
            : filteredUdfFields.map(([fieldType, config]) =>
                renderFieldItem(fieldType as FieldType, config),
              )}
        </div>
      </div>
    </div>
  );
};
