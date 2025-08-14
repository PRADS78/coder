import { useState } from "react";
import {
  FormField,
  DropdownProperties,
  DatePickerProperties,
  generateId,
} from "@/lib/form-schema";
import { useDragAndDrop, createDragItem } from "@/hooks/useDragAndDrop";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Trash2, GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onClone: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onClone,
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
  } = useDragAndDrop({
    onDrop: (item, result) => {
      if (item.type === "dropdown-option") {
        const { fromIndex, toIndex } = item.data;
        const dropdownProps = field.properties as DropdownProperties;
        const newOptions = [...(dropdownProps.options || [])];
        const [movedOption] = newOptions.splice(fromIndex, 1);
        newOptions.splice(toIndex, 0, movedOption);
        handlePropertyUpdate("options", newOptions);
      }
    },
    acceptTypes: ["dropdown-option"],
  });

  const handleDragStart = (e: React.DragEvent) => {
    const dragItem = createDragItem(field.id, "field-reorder", {
      fieldId: field.id,
    });
    onDragStart(e, dragItem);
  };

  const handleOptionDragStart = (e: React.DragEvent, fromIndex: number) => {
    const dragItem = createDragItem(`option-${fromIndex}`, "dropdown-option", {
      fromIndex,
      fieldId: field.id,
    });
    onDragStart(e, dragItem);
  };

  const handleOptionDrop = (e: React.DragEvent, toIndex: number) => {
    e.stopPropagation();
    onDrop(e, field.id, toIndex);
  };

  const handlePropertyUpdate = (key: string, value: any) => {
    onUpdate({
      properties: {
        ...field.properties,
        [key]: value,
      },
    });
  };

  const isUDFField = field.type.startsWith("udf-");

  const renderFieldSpecificControls = () => {
    if (isUDFField) {
      return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600 italic">
            This field will be automatically filled from user data
          </p>
        </div>
      );
    }

    switch (field.type) {
      case "date-picker":
        const dateProps = field.properties as DatePickerProperties;
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Date Format:
              </Label>
              <RadioGroup
                value={dateProps.dateFormat || "DD/MM/YYYY"}
                onValueChange={(value) =>
                  handlePropertyUpdate("dateFormat", value)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DD/MM/YYYY" id="dd-mm-yyyy" />
                  <Label htmlFor="dd-mm-yyyy" className="text-sm">
                    DD/MM/YYYY
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MM/DD/YYYY" id="mm-dd-yyyy" />
                  <Label htmlFor="mm-dd-yyyy" className="text-sm">
                    MM/DD/YYYY
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case "dropdown":
        const dropdownProps = field.properties as DropdownProperties;
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Options:
              </Label>
              <div className="space-y-2">
                {dropdownProps.options?.map((option, index) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2"
                    onDragOver={onDragOver}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => handleOptionDrop(e, index)}
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleOptionDragStart(e, index)}
                      onDragEnd={onDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600">{index + 1}.</span>
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(dropdownProps.options || [])];
                        newOptions[index] = {
                          ...option,
                          label: e.target.value,
                          value: e.target.value,
                        };
                        handlePropertyUpdate("options", newOptions);
                      }}
                      placeholder="Option text"
                      className="flex-1 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = dropdownProps.options?.filter(
                          (_, i) => i !== index,
                        );
                        handlePropertyUpdate("options", newOptions);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = [
                      ...(dropdownProps.options || []),
                      {
                        id: generateId(),
                        label: `Option ${(dropdownProps.options?.length || 0) + 1}`,
                        value: `option${(dropdownProps.options?.length || 0) + 1}`,
                      },
                    ];
                    handlePropertyUpdate("options", newOptions);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Selection Type:
              </Label>
              <RadioGroup
                value={dropdownProps.selectionType || "single"}
                onValueChange={(value) =>
                  handlePropertyUpdate("selectionType", value)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single-select" />
                  <Label htmlFor="single-select" className="text-sm">
                    Single Select
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multi" id="multi-select" />
                  <Label htmlFor="multi-select" className="text-sm">
                    Multi Select
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFieldPreview = () => {
    if (isUDFField) {
      return (
        <Input
          placeholder={`${field.label} (auto-filled)`}
          disabled
          className="bg-gray-100 text-gray-500"
        />
      );
    }

    switch (field.type) {
      case "short-text":
        return (
          <Input
            placeholder="Short text answer"
            disabled
            className="bg-gray-50"
          />
        );
      case "long-text":
        return (
          <Textarea
            placeholder="Long text answer"
            disabled
            className="bg-gray-50"
            rows={3}
          />
        );
      case "date-picker":
        return (
          <div>
            <Input
              placeholder="Select the date"
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(field.properties as DatePickerProperties).dateFormat ||
                "DD/MM/YYYY"}
            </p>
          </div>
        );
      case "dropdown":
        return (
          <div className="space-y-2">
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <span className="text-gray-500 text-sm">
                {(field.properties as DropdownProperties).selectionType ===
                "multi"
                  ? "Select multiple options..."
                  : "Select an option..."}
              </span>
            </div>
          </div>
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder="Enter a number"
            disabled
            className="bg-gray-50"
          />
        );
      case "file-upload":
        return (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
            <p className="text-gray-500 text-sm">Upload files here</p>
          </div>
        );
      default:
        return (
          <Input placeholder="Enter value" disabled className="bg-gray-50" />
        );
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg bg-white transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-indigo-500 shadow-md"
          : "border-gray-200 hover:border-gray-300",
        !isSelected && "opacity-75 hover:opacity-100",
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        className="flex items-center justify-center w-full h-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-t-lg"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="p-4">
        {/* Field Label */}
        <div className="mb-3">
          {editingLabel ? (
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              onBlur={() => setEditingLabel(false)}
              onKeyPress={(e) => e.key === "Enter" && setEditingLabel(false)}
              className="text-lg font-medium border-none p-0 focus:ring-0"
              placeholder="Question title"
              autoFocus
            />
          ) : (
            <h3
              className={cn(
                "text-lg font-medium cursor-text",
                isSelected ? "text-gray-900" : "text-gray-600",
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) setEditingLabel(true);
              }}
            >
              {field.label || "Untitled Question"}
            </h3>
          )}
        </div>

        {/* Field Description */}
        {field.showDescription && (
          <div className="mb-3">
            {editingDescription ? (
              <Textarea
                value={field.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                onBlur={() => setEditingDescription(false)}
                className="border-none p-0 focus:ring-0 resize-none text-sm"
                placeholder="Description"
                rows={2}
                autoFocus
              />
            ) : (
              <p
                className={cn(
                  "text-sm cursor-text",
                  isSelected ? "text-gray-700" : "text-gray-500",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSelected) setEditingDescription(true);
                }}
              >
                {field.description || "Click to add description"}
              </p>
            )}
          </div>
        )}

        {/* Field Preview */}
        <div className="mb-4">{renderFieldPreview()}</div>

        {/* Field Specific Controls (only when selected) */}
        {isSelected && (
          <div className="mb-4">{renderFieldSpecificControls()}</div>
        )}

        {/* Controls */}
        {isSelected && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClone();
                }}
                className="h-8 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Clone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.showDescription}
                  onCheckedChange={(checked) =>
                    onUpdate({ showDescription: checked })
                  }
                  id={`desc-${field.id}`}
                />
                <Label htmlFor={`desc-${field.id}`} className="text-xs">
                  Description
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                  id={`req-${field.id}`}
                />
                <Label htmlFor={`req-${field.id}`} className="text-xs">
                  Required
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
