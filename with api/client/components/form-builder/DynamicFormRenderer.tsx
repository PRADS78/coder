import { useState, useRef, useEffect } from "react";
import {
  FormSchema,
  FormField,
  FormItem,
  isFormField,
  isFormSection,
  getAllFields,
} from "@/lib/form-schema";
import {
  configService,
  getFieldDefinition,
  loadFormConfig,
} from "@/lib/config-service";
import { renderDynamicField } from "@/lib/component-registry";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicFormRendererProps {
  schema: FormSchema;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  onSubmit?: (values: Record<string, any>) => void;
  mode?: "preview" | "response";
  className?: string;
}

interface SubmittedFormData {
  schema: FormSchema;
  values: Record<string, any>;
  submittedAt: Date;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
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
  const [configLoaded, setConfigLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load configuration on mount
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        await loadFormConfig();
        setConfigLoaded(true);
        console.log("✅ Form configuration loaded");
      } catch (error) {
        console.error("❌ Failed to load form configuration:", error);
        setConfigLoaded(true); // Still render with fallback
      }
    };

    initializeConfig();
  }, []);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const allFields = getAllFields(schema.items);

    // Validate required fields
    allFields.forEach((field) => {
      if (field.required) {
        const value = formValues[field.id];
        if (!value || value === "") {
          errors[field.id] = `${field.label} is required`;
        }
      }

      // Get field definition for custom validation
      const fieldDef = getFieldDefinition(field.type);
      if (fieldDef?.validation?.custom && formValues[field.id]) {
        const customValidation = fieldDef.validation.custom;

        // Handle different validation types
        if (customValidation === "validateFileSize") {
          const file = formValues[field.id];
          if (file && file.size > 2097152) {
            errors[field.id] = "File size must be less than 2MB";
          }
        }

        // Add more custom validations as needed
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      const submissionData: SubmittedFormData = {
        schema,
        values: formValues,
        submittedAt: new Date(),
      };
      setSubmittedData(submissionData);
      setIsSubmitted(true);
      onSubmit?.(formValues);
    }

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
    if (!configLoaded) {
      // Show loading placeholder while config loads
      return (
        <div key={field.id} className="mb-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      );
    }

    const fieldValue = formValues[field.id];
    const hasError = !!validationErrors[field.id];
    const fieldDef = getFieldDefinition(field.type);

    if (!fieldDef) {
      console.warn(`⚠️ Field definition not found for type: ${field.type}`);
      return (
        <div
          key={field.id}
          className="mb-6 p-4 border border-red-200 rounded bg-red-50"
        >
          <p className="text-red-600 text-sm">
            Field type "{field.type}" not found in configuration
          </p>
        </div>
      );
    }

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

    // Use dynamic component rendering
    const fieldComponent = renderDynamicField(fieldDef, {
      field: fieldDef,
      value: fieldValue,
      onChange: (value: any) => !disabled && updateValue(field.id, value),
      disabled,
      error: hasError ? validationErrors[field.id] : undefined,
      placeholder: field.description || fieldDef.defaultProperties?.placeholder,
      required: field.required,
      // Pass through any additional field properties
      ...field.properties,
    });

    return fieldWrapper(fieldComponent);
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

  // Show loading while configuration loads
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  // Layout 1: No sections - Clean single column
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

  // Layout 2: With sections - Sidebar layout
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
