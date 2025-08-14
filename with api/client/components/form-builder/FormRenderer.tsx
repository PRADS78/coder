import { useState, useRef, useEffect } from "react";
import {
  FormSchema,
  FormField,
  FormItem,
  DropdownProperties,
  DatePickerProperties,
  FileUploadProperties,
  isFormField,
  isFormSection,
  getAllFields,
} from "@/lib/form-schema";
import { validateForm, ValidationResult } from "@/lib/form-validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CalendarIcon,
  Upload,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Download,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FormRendererProps {
  schema: FormSchema;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  onSubmit?: (
    values: Record<string, any>,
    validation: ValidationResult,
  ) => void;
  mode?: "preview" | "response";
  className?: string;
}

interface SubmittedFormData {
  schema: FormSchema;
  values: Record<string, any>;
  submittedAt: Date;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  values = {},
  onValuesChange,
  onSubmit,
  mode = "response",
  className,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(values);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedFormData | null>(
    null,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize all sections as open by default
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    schema.items.forEach((item) => {
      if (isFormSection(item)) {
        initialOpenState[item.id] = true;
      }
    });
    setOpenSections(initialOpenState);
  }, [schema.items]);

  const updateValue = (fieldId: string, value: any) => {
    const newValues = { ...formValues, [fieldId]: value };
    setFormValues(newValues);
    onValuesChange?.(newValues);

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleClear = () => {
    setFormValues({});
    setValidationErrors({});
    onValuesChange?.({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create a temporary schema with sections for validation
    const tempSchema = {
      ...schema,
      sections: [
        {
          id: "temp",
          title: "Form",
          description: "",
          fields: getAllFields(schema.items),
          order: 0,
        },
      ],
    };

    const validation = validateForm(tempSchema, formValues);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.fieldId] = error.message;
      });
      setValidationErrors(errorMap);
    } else {
      setValidationErrors({});
      // Save submitted data
      const submissionData: SubmittedFormData = {
        schema,
        values: formValues,
        submittedAt: new Date(),
      };
      setSubmittedData(submissionData);
      setIsSubmitted(true);
    }

    onSubmit?.(formValues, validation);
    setIsSubmitting(false);
  };

  const handleViewAnswers = () => {
    setIsSubmitted(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element && contentRef.current) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Calculate progress for each section
  const getSectionProgress = (section: any) => {
    const totalFields = section.fields.length;
    const answeredFields = section.fields.filter((field: FormField) => {
      const value = formValues[field.id];
      return value !== undefined && value !== null && value !== "";
    }).length;
    return { answered: answeredFields, total: totalFields };
  };

  // Check if form can be submitted
  const canSubmit = () => {
    const allFields = getAllFields(schema.items);
    const requiredFields = allFields.filter((field) => field.required);

    return requiredFields.every((field) => {
      const value = formValues[field.id];
      return value !== undefined && value !== null && value !== "";
    });
  };

  const renderField = (
    field: FormField,
    questionNumber?: number,
    disabled = false,
  ) => {
    const fieldValue = formValues[field.id];
    const hasError = !!validationErrors[field.id];
    const isUDF = field.type.startsWith("udf-");

    const fieldWrapper = (children: React.ReactNode) => (
      <div className="mb-6">
        <div className="mb-3">
          <Label className="text-sm font-medium text-gray-700 flex items-start leading-5">
            {questionNumber && (
              <span className="text-gray-900 mr-2 flex-shrink-0 font-medium">
                {questionNumber}.
              </span>
            )}
            <span className="text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </Label>
          {field.showDescription && field.description && (
            <p className="text-sm text-gray-600 mt-1 ml-6">
              {field.description}
            </p>
          )}
        </div>
        <div className="ml-6">
          {children}
          {hasError && (
            <p className="text-sm text-red-600 mt-2">
              {validationErrors[field.id]}
            </p>
          )}
        </div>
      </div>
    );

    if (isUDF) {
      return fieldWrapper(
        <Input
          value=""
          disabled
          placeholder={`${field.label} (auto-filled from user data)`}
          className="bg-gray-100 text-gray-500 border-gray-200"
        />,
      );
    }

    switch (field.type) {
      case "short-text":
        return fieldWrapper(
          <Input
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            disabled={disabled}
            className={cn(
              "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              hasError &&
                "border-red-300 focus:border-red-500 focus:ring-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "long-text":
        return fieldWrapper(
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            rows={4}
            disabled={disabled}
            className={cn(
              "border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none",
              hasError &&
                "border-red-300 focus:border-red-500 focus:ring-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "number":
        return fieldWrapper(
          <Input
            type="number"
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            min={(field.properties as any).min}
            max={(field.properties as any).max}
            step={(field.properties as any).step}
            disabled={disabled}
            className={cn(
              "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              hasError &&
                "border-red-300 focus:border-red-500 focus:ring-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "date-picker":
        return fieldWrapper(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400",
                  !fieldValue && "text-gray-500",
                  hasError && "border-red-300",
                  disabled && "bg-gray-50 cursor-not-allowed",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldValue
                  ? format(new Date(fieldValue), "PPP")
                  : "Select a date"}
              </Button>
            </PopoverTrigger>
            {!disabled && (
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fieldValue ? new Date(fieldValue) : undefined}
                  onSelect={(date) =>
                    updateValue(field.id, date?.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            )}
          </Popover>,
        );

      case "dropdown":
        const dropdownProps = field.properties as DropdownProperties;

        if (dropdownProps.selectionType === "multi") {
          return fieldWrapper(
            <div className="space-y-3">
              {dropdownProps.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${field.id}-${option.id}`}
                    disabled={disabled}
                    checked={
                      Array.isArray(fieldValue) &&
                      fieldValue.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      if (disabled) return;
                      const currentValues = Array.isArray(fieldValue)
                        ? fieldValue
                        : [];
                      if (checked) {
                        updateValue(field.id, [...currentValues, option.value]);
                      } else {
                        updateValue(
                          field.id,
                          currentValues.filter((v) => v !== option.value),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.id}-${option.id}`}
                    className="text-sm font-normal text-gray-700"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>,
          );
        } else {
          return fieldWrapper(
            <Select
              value={fieldValue || ""}
              onValueChange={(value) =>
                !disabled && updateValue(field.id, value)
              }
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                  hasError &&
                    "border-red-300 focus:border-red-500 focus:ring-red-500",
                  disabled && "bg-gray-50",
                )}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {dropdownProps.options?.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          );
        }

      case "file-upload":
        const fileProps = field.properties as FileUploadProperties;

        // Handle file size validation (2MB limit)
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (disabled) return;
          const files = e.target.files;
          if (files && files[0]) {
            const file = files[0];
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes

            if (file.size > maxSize) {
              alert("File size must be less than 2MB");
              e.target.value = ""; // Clear the input
              return;
            }

            updateValue(field.id, file); // Only single file upload now
          }
        };

        // Handle file download (when showing submitted response)
        const handleDownload = (file: File) => {
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        // Handle file delete (when in response mode)
        const handleDelete = () => {
          updateValue(field.id, null);
        };

        return fieldWrapper(
          <div className="space-y-2">
            {!fieldValue ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors hover:border-gray-400">
                <input
                  type="file"
                  id={`file-${field.id}`}
                  accept={fileProps.acceptedTypes?.join(",")}
                  disabled={disabled}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor={`file-${field.id}`}
                  className={cn(
                    "cursor-pointer flex flex-col items-center",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload a file (max 2MB)
                  </p>
                  {fileProps.acceptedTypes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted: {fileProps.acceptedTypes.join(", ")}
                    </p>
                  )}
                </Label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {fieldValue.name || "File"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(fieldValue.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(fieldValue)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!disabled && mode === "response" && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>,
        );

      default:
        return fieldWrapper(
          <Input
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            disabled={disabled}
            className={cn(
              "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              disabled && "bg-gray-50",
            )}
          />,
        );
    }
  };

  const sectionsWithFields = schema.items.filter(
    (item) => isFormSection(item) && item.fields.length > 0,
  );
  const hasAnySections = sectionsWithFields.length > 0;
  const standaloneFields = schema.items.filter((item) => isFormField(item));

  let questionCounter = 1;

  // Show submitted view
  if (isSubmitted && submittedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your response has been submitted successfully.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              Submitted on {submittedData.submittedAt.toLocaleString()}
            </div>
            <Button
              onClick={handleViewAnswers}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Your Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Layout 1: No sections - Clean single column (Image 1)
  if (!hasAnySections) {
    return (
      <div className={cn("min-h-screen bg-gray-50", className)}>
        <div className="max-w-2xl mx-auto py-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold mb-2">{schema.title}</h1>
              {schema.description && (
                <p className="text-blue-100 text-lg">{schema.description}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {standaloneFields.map((field) => (
                  <div key={field.id}>
                    {renderField(
                      field as FormField,
                      questionCounter++,
                      submittedData ? true : false,
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {mode === "response" && !submittedData && (
                <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit()}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Layout 2: With sections - Sidebar layout (Image 2)
  return (
    <div className={cn("flex h-screen bg-gray-50", className)}>
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Form Sections</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sectionsWithFields.map((section, index) => {
            const progress = getSectionProgress(section);
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
              >
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs opacity-90 mt-1">
                      {progress.answered} of {progress.total} answered
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-3xl mx-auto py-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold mb-2">{schema.title}</h1>
              {schema.description && (
                <p className="text-blue-100 text-lg">{schema.description}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Standalone Fields */}
              {standaloneFields.map((field) => (
                <div
                  key={field.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  {renderField(
                    field as FormField,
                    questionCounter++,
                    submittedData ? true : false,
                  )}
                </div>
              ))}

              {/* Sections */}
              {sectionsWithFields.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  id={`section-${section.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <Collapsible
                    open={openSections[section.id] ?? true}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    {/* Section Header */}
                    <div className="bg-blue-600 text-white">
                      <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 text-left hover:bg-blue-700 transition-colors">
                        {openSections[section.id] ? (
                          <ChevronDown className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-200 mb-1">
                            <span className="bg-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              SECTION {sectionIndex + 1} OF{" "}
                              {sectionsWithFields.length}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold">{section.title}</h2>
                          {section.description && (
                            <p className="text-blue-100 text-sm mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className="p-6 space-y-6">
                        {section.fields.map((field) => (
                          <div key={field.id}>
                            {renderField(
                              field,
                              questionCounter++,
                              submittedData ? true : false,
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {mode === "response" && !submittedData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit()}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
