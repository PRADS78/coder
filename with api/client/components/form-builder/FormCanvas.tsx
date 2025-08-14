import { useState, useRef, useEffect } from "react";
import {
  FormSchema,
  FormSection,
  FormField,
  FormItem,
  generateId,
  createDefaultField,
  createDefaultSection,
  isFormField,
  isFormSection,
} from "@/lib/form-schema";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { FieldEditor } from "./FieldEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  GripVertical,
  Trash2,
  Folder,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./FormCanvas.module.scss";

interface FormCanvasProps {
  schema: FormSchema;
  onSchemaChange: (schema: FormSchema) => void;
  selectedField: string | null;
  onFieldSelect: (fieldId: string | null) => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  schema,
  onSchemaChange,
  selectedField,
  onFieldSelect,
}) => {
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingSections, setEditingSections] = useState<
    Record<string, { title: boolean; description: boolean }>
  >({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showSectionMoveDialog, setShowSectionMoveDialog] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // useDragAndDrop hook handles all drag operations including auto-scroll

  const {
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
    dropTarget,
    onDragStart,
    onDragEnd,
  } = useDragAndDrop({
    onDrop: (item, result) => {
      if (item.type === "field-type") {
        handleAddField(item.data.fieldType, result.targetId, result.position);
      } else if (item.type === "field-reorder") {
        handleReorderField(item.data.fieldId, result.targetId, result.position);
      } else if (item.type === "section-reorder") {
        handleReorderSection(item.data.sectionId, result.position);
      } else if (item.type === "section-dialog-reorder") {
        handleDialogSectionReorder(item.data.sectionId, result.position);
      }
    },
    acceptTypes: [
      "field-type",
      "field-reorder",
      "section-reorder",
      "section-dialog-reorder",
    ],
    autoScroll: true,
    scrollContainer: () => canvasRef.current,
  });

  const getDropZonePosition = (e: React.DragEvent, targetId?: string) => {
    if (!targetId) {
      // Dropping in main area
      const mouseY = e.clientY;
      const container = e.currentTarget as HTMLElement;
      const itemElements = container.querySelectorAll("[data-item-id]");

      for (let i = 0; i < itemElements.length; i++) {
        const element = itemElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;

        if (mouseY < elementMiddle) {
          return i;
        }
      }

      return schema.items.length;
    } else {
      // Dropping in a section
      const section = schema.items.find(
        (item) => isFormSection(item) && item.id === targetId,
      ) as FormSection;
      if (!section) return 0;

      const mouseY = e.clientY;
      const container = e.currentTarget as HTMLElement;
      const fieldElements = container.querySelectorAll("[data-field-id]");

      for (let i = 0; i < fieldElements.length; i++) {
        const element = fieldElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;

        if (mouseY < elementMiddle) {
          return i;
        }
      }

      return section.fields.length;
    }
  };

  const handleAddField = (
    fieldType: any,
    targetId?: string,
    position?: number,
  ) => {
    const defaultField = createDefaultField(fieldType);
    const newField: FormField = {
      ...defaultField,
      id: generateId(),
      order: 0,
    };

    const updatedSchema = { ...schema };

    if (targetId) {
      // Adding to a specific section
      const sectionIndex = updatedSchema.items.findIndex(
        (item) => isFormSection(item) && item.id === targetId,
      );
      if (sectionIndex >= 0) {
        const section = updatedSchema.items[sectionIndex] as FormSection;
        const insertPosition = position ?? section.fields.length;
        section.fields.splice(insertPosition, 0, newField);

        section.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    } else {
      // Adding to main form area
      const insertPosition = position ?? updatedSchema.items.length;
      updatedSchema.items.splice(insertPosition, 0, newField);

      updatedSchema.items.forEach((item, index) => {
        if (isFormField(item)) {
          item.order = index;
        } else {
          item.order = index;
        }
      });
    }

    onSchemaChange(updatedSchema);
    onFieldSelect(newField.id);
  };

  const handleReorderField = (
    fieldId: string,
    targetId?: string,
    position?: number,
  ) => {
    const updatedSchema = { ...schema };
    let sourceField: FormField | null = null;
    let sourceLocation: {
      type: "main" | "section";
      index: number;
      sectionId?: string;
    } | null = null;

    // Find and remove the field
    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        sourceField = item;
        sourceLocation = { type: "main", index: i };
        updatedSchema.items.splice(i, 1);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          sourceField = item.fields[fieldIndex];
          sourceLocation = {
            type: "section",
            index: fieldIndex,
            sectionId: item.id,
          };
          item.fields.splice(fieldIndex, 1);
          break;
        }
      }
    }

    if (!sourceField || !sourceLocation) return;

    // Add field to new position
    if (targetId) {
      const sectionIndex = updatedSchema.items.findIndex(
        (item) => isFormSection(item) && item.id === targetId,
      );
      if (sectionIndex >= 0) {
        const section = updatedSchema.items[sectionIndex] as FormSection;
        const insertPosition = position ?? section.fields.length;
        section.fields.splice(insertPosition, 0, sourceField);

        section.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    } else {
      const insertPosition = position ?? updatedSchema.items.length;
      updatedSchema.items.splice(insertPosition, 0, sourceField);

      updatedSchema.items.forEach((item, index) => {
        if (isFormField(item)) {
          item.order = index;
        } else {
          item.order = index;
        }
      });
    }

    // Reorder source location if it was a section
    if (sourceLocation.type === "section" && sourceLocation.sectionId) {
      const sourceSection = updatedSchema.items.find(
        (item) => isFormSection(item) && item.id === sourceLocation.sectionId,
      ) as FormSection;
      if (sourceSection) {
        sourceSection.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleReorderSection = (sectionId: string, newPosition?: number) => {
    const updatedSchema = { ...schema };
    const sectionIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === sectionId,
    );

    if (sectionIndex >= 0 && newPosition !== undefined) {
      const [section] = updatedSchema.items.splice(sectionIndex, 1);
      updatedSchema.items.splice(newPosition, 0, section);

      // Reorder all items
      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleDialogSectionReorder = (
    draggedSectionId: string,
    targetPosition?: number,
  ) => {
    const updatedSchema = { ...schema };
    const draggedIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === draggedSectionId,
    );

    if (draggedIndex !== -1 && targetPosition !== undefined) {
      const [draggedSection] = updatedSchema.items.splice(draggedIndex, 1);
      updatedSchema.items.splice(targetPosition, 0, draggedSection);

      // Reorder all items
      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleMoveSectionUp = (sectionId: string) => {
    const updatedSchema = { ...schema };
    const currentIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === sectionId,
    );

    if (currentIndex > 0) {
      // Find the previous section or field
      let targetIndex = currentIndex - 1;

      // Move the section
      const [section] = updatedSchema.items.splice(currentIndex, 1);
      updatedSchema.items.splice(targetIndex, 0, section);

      // Reorder all items
      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleMoveSectionDown = (sectionId: string) => {
    const updatedSchema = { ...schema };
    const currentIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === sectionId,
    );

    if (currentIndex < updatedSchema.items.length - 1) {
      // Find the next section or field
      let targetIndex = currentIndex + 1;

      // Move the section
      const [section] = updatedSchema.items.splice(currentIndex, 1);
      updatedSchema.items.splice(targetIndex, 0, section);

      // Reorder all items
      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedSchema = { ...schema };

    for (const item of updatedSchema.items) {
      if (isFormField(item) && item.id === fieldId) {
        Object.assign(item, updates);
        break;
      } else if (isFormSection(item)) {
        const field = item.fields.find((f) => f.id === fieldId);
        if (field) {
          Object.assign(field, updates);
          break;
        }
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        updatedSchema.items.splice(i, 1);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          item.fields.splice(fieldIndex, 1);
          item.fields.forEach((field, index) => {
            field.order = index;
          });
          break;
        }
      }
    }

    updatedSchema.items.forEach((item, index) => {
      if (isFormField(item)) {
        item.order = index;
      } else {
        item.order = index;
      }
    });

    onSchemaChange(updatedSchema);
    if (selectedField === fieldId) {
      onFieldSelect(null);
    }
  };

  const handleCloneField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        const clonedField: FormField = {
          ...item,
          id: generateId(),
          label: `${item.label} (Copy)`,
          order: i + 1,
        };
        updatedSchema.items.splice(i + 1, 0, clonedField);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          const originalField = item.fields[fieldIndex];
          const clonedField: FormField = {
            ...originalField,
            id: generateId(),
            label: `${originalField.label} (Copy)`,
            order: fieldIndex + 1,
          };
          item.fields.splice(fieldIndex + 1, 0, clonedField);
          item.fields.forEach((field, index) => {
            field.order = index;
          });
          break;
        }
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleAddSection = () => {
    const newSection = createDefaultSection();
    newSection.order = schema.items.length;

    const updatedSchema = {
      ...schema,
      items: [...schema.items, newSection],
    };

    setOpenSections((prev) => ({ ...prev, [newSection.id]: true }));
    onSchemaChange(updatedSchema);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSchema = { ...schema };
    const sectionIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === sectionId,
    );

    if (sectionIndex >= 0) {
      updatedSchema.items.splice(sectionIndex, 1);

      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleHeaderUpdate = (
    field: "title" | "description",
    value: string,
  ) => {
    const updatedSchema = {
      ...schema,
      [field]: value,
      updatedAt: new Date(),
    };
    onSchemaChange(updatedSchema);
  };

  const handleSectionUpdate = (
    sectionId: string,
    field: "title" | "description",
    value: string,
  ) => {
    const updatedSchema = { ...schema };
    const section = updatedSchema.items.find(
      (item) => isFormSection(item) && item.id === sectionId,
    ) as FormSection;
    if (section) {
      section[field] = value;
      onSchemaChange(updatedSchema);
    }
  };

  const toggleSectionEditing = (
    sectionId: string,
    field: "title" | "description",
    value: boolean,
  ) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Calculate section numbering - only count sections, not standalone fields
  const sections = schema.items.filter((item) => isFormSection(item));
  const totalSections = sections.length;

  return (
    <div ref={canvasRef} className={styles.canvas}>
      <div className={styles.canvasContainer}>
        {/* Form Header */}
        <div className={styles.formHeader}>
          <div className={styles.headerBadge}>
            <span className={styles.headerBadgeText}>Form Header</span>
          </div>
          <div className={styles.headerContent}>
            {editingHeader ? (
              <div className={styles.headerEditableContent}>
                <Input
                  value={schema.title}
                  onChange={(e) => handleHeaderUpdate("title", e.target.value)}
                  onBlur={() => setEditingHeader(false)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && setEditingHeader(false)
                  }
                  className={styles.inlineInput}
                  placeholder="Form title"
                  autoFocus
                />
                <Textarea
                  value={schema.description || ""}
                  onChange={(e) =>
                    handleHeaderUpdate("description", e.target.value)
                  }
                  onBlur={() => setEditingHeader(false)}
                  className={styles.inlineTextarea}
                  placeholder="Form description"
                  rows={2}
                />
              </div>
            ) : (
              <div
                className={styles.headerClickableContent}
                onClick={() => setEditingHeader(true)}
              >
                <h1 className={styles.headerTitle}>{schema.title || ""}</h1>
                <p className={styles.headerDescription}>
                  {schema.description || ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Drop Zone */}
        <div
          className={cn(
            styles.dropZone,
            dropTarget === "main" && styles.active,
          )}
          data-drop-target="main"
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            const position = getDropZonePosition(e);
            onDrop(e, undefined, position);
          }}
        >
          {schema.items.length === 0 ? (
            <div className={styles.emptyDropZone}>
              <div className={styles.emptyContent}>
                <GripVertical className={styles.emptyIcon} />
                <p className={styles.emptyText}>
                  Drag fields from the left panel or add a section
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.fieldsContainer}>
              {schema.items.map((item, index) => (
                <div key={item.id} data-item-id={item.id}>
                  {isFormField(item) ? (
                    <div data-field-id={item.id}>
                      <FieldEditor
                        field={item}
                        isSelected={selectedField === item.id}
                        onSelect={() => onFieldSelect(item.id)}
                        onUpdate={(updates) =>
                          handleUpdateField(item.id, updates)
                        }
                        onDelete={() => handleDeleteField(item.id)}
                        onClone={() => handleCloneField(item.id)}
                      />
                    </div>
                  ) : (
                    <Collapsible
                      open={openSections[item.id] ?? true}
                      onOpenChange={() => toggleSection(item.id)}
                    >
                      <div className={styles.formSection}>
                        {/* Section Header */}
                        <div className={styles.sectionHeader}>
                          <div className={styles.sectionHeaderLeft}>
                            <CollapsibleTrigger>
                              {openSections[item.id] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </CollapsibleTrigger>
                            <span className={styles.sectionBadge}>
                              Section{" "}
                              {sections.findIndex((s) => s.id === item.id) + 1}{" "}
                              of {totalSections}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-indigo-700"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleMoveSectionUp(item.id)}
                                disabled={
                                  sections.findIndex(
                                    (s) => s.id === item.id,
                                  ) === 0
                                }
                              >
                                <ArrowUp className="w-4 h-4 mr-2" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMoveSectionDown(item.id)}
                                disabled={
                                  sections.findIndex(
                                    (s) => s.id === item.id,
                                  ) ===
                                  sections.length - 1
                                }
                              >
                                <ArrowDown className="w-4 h-4 mr-2" />
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setShowSectionMoveDialog(true)}
                              >
                                <Move className="w-4 h-4 mr-2" />
                                Rearrange Sections
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSection(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Section
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <CollapsibleContent>
                          {/* Section Details */}
                          <div className={styles.sectionDetails}>
                            {editingSections[item.id]?.title ? (
                              <Input
                                value={item.title}
                                onChange={(e) =>
                                  handleSectionUpdate(
                                    item.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  toggleSectionEditing(item.id, "title", false)
                                }
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  toggleSectionEditing(item.id, "title", false)
                                }
                                className="text-lg font-semibold border-2 border-indigo-300 rounded px-2 py-1"
                                autoFocus
                              />
                            ) : (
                              <h3
                                className={styles.sectionTitle}
                                onClick={() =>
                                  toggleSectionEditing(item.id, "title", true)
                                }
                              >
                                {item.title}
                              </h3>
                            )}

                            {editingSections[item.id]?.description ? (
                              <Textarea
                                value={item.description || ""}
                                onChange={(e) =>
                                  handleSectionUpdate(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  toggleSectionEditing(
                                    item.id,
                                    "description",
                                    false,
                                  )
                                }
                                className="text-sm border-2 border-indigo-300 rounded px-2 py-1 resize-none"
                                placeholder="Section description"
                                rows={2}
                                autoFocus
                              />
                            ) : (
                              <p
                                className={styles.sectionDescription}
                                onClick={() =>
                                  toggleSectionEditing(
                                    item.id,
                                    "description",
                                    true,
                                  )
                                }
                              >
                                {item.description || ""}
                              </p>
                            )}
                          </div>

                          {/* Section Drop Zone */}
                          <div
                            className={cn(
                              styles.sectionDropZone,
                              dropTarget === item.id && styles.active,
                            )}
                            data-drop-target={item.id}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => {
                              const position = getDropZonePosition(e, item.id);
                              onDrop(e, item.id, position);
                            }}
                          >
                            {item.fields.length === 0 ? (
                              <div className={styles.emptyDropZone}>
                                <div className={styles.emptyContent}>
                                  <GripVertical className={styles.emptyIcon} />
                                  <p className={styles.emptyText}>
                                    Drop fields here
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.fieldsContainer}>
                                {item.fields.map((field) => (
                                  <div key={field.id} data-field-id={field.id}>
                                    <FieldEditor
                                      field={field}
                                      isSelected={selectedField === field.id}
                                      onSelect={() => onFieldSelect(field.id)}
                                      onUpdate={(updates) =>
                                        handleUpdateField(field.id, updates)
                                      }
                                      onDelete={() =>
                                        handleDeleteField(field.id)
                                      }
                                      onClone={() => handleCloneField(field.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Section Button */}
        <div className={styles.addSectionContainer}>
          <Button
            variant="outline"
            onClick={handleAddSection}
            className={styles.addSectionButton}
          >
            <Folder className="w-4 h-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Section Rearrange Dialog */}
      <Dialog
        open={showSectionMoveDialog}
        onOpenChange={setShowSectionMoveDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rearrange Sections</DialogTitle>
          </DialogHeader>
          <div
            className="space-y-2 max-h-96 overflow-y-auto"
            data-drop-target="section-dialog"
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const sectionElements = e.currentTarget.querySelectorAll(
                "[data-section-index]",
              );
              let targetIndex = sections.length;

              for (let i = 0; i < sectionElements.length; i++) {
                const element = sectionElements[i] as HTMLElement;
                const elementRect = element.getBoundingClientRect();
                const elementY = elementRect.top - rect.top;

                if (y < elementY + elementRect.height / 2) {
                  targetIndex = i;
                  break;
                }
              }

              onDrop(e, "section-dialog", targetIndex);
            }}
          >
            {sections.map((section, index) => {
              return (
                <div
                  key={section.id}
                  data-section-index={index}
                  draggable
                  onDragStart={(e) =>
                    onDragStart(e, {
                      id: section.id,
                      type: "section-dialog-reorder",
                      data: { sectionId: section.id },
                    })
                  }
                  onDragEnd={onDragEnd}
                  className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {section.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {section.fields.length} field(s)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSectionMoveDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
