import { useState } from "react";
import {
  FormSchema,
  FieldType,
  createDefaultForm,
  createDefaultField,
  generateId,
} from "@/lib/form-schema";
import { FieldsSidebar } from "./FieldsSidebar";
import { FormCanvas } from "./FormCanvas";
import { FormRenderer } from "./FormRenderer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Settings, Save, FileText, MessageSquare } from "lucide-react";
import styles from "./FormBuilder.module.scss";

interface FormBuilderProps {
  initialSchema?: FormSchema;
  onSave?: (schema: FormSchema) => void;
  onPublish?: (schema: FormSchema) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialSchema,
  onSave,
  onPublish,
}) => {
  const createDemoForm = (): FormSchema => {
    const form = createDefaultForm();
    form.title = "Course Feedback Form";
    form.description =
      "Help us improve! Share your feedback on your learning experience.";

    return form;
  };

  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || createDemoForm(),
  );
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "configuration" | "preview" | "response"
  >("configuration");

  const handleFieldAdd = (fieldType: FieldType) => {
    const defaultField = createDefaultField(fieldType);
    const newField = {
      ...defaultField,
      id: generateId(),
      order: schema.items.length,
    };

    const updatedSchema = { ...schema };
    updatedSchema.items.push(newField);
    updatedSchema.updatedAt = new Date();

    setSchema(updatedSchema);
    setSelectedField(newField.id);
  };

  const handleSchemaChange = (updatedSchema: FormSchema) => {
    setSchema(updatedSchema);
  };

  const handleSave = () => {
    onSave?.(schema);
  };

  const handlePublish = () => {
    onPublish?.(schema);
  };

  const handleFormSubmit = (values: Record<string, any>, validation: any) => {
    console.log("Form Schema:", JSON.stringify(schema, null, 2));
    console.log("Form Response:", JSON.stringify(values, null, 2));
    console.log("Validation Result:", validation);
  };

  return (
    <div className={styles.formBuilder}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandSection}>
            <div className={styles.brandIcon}>
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className={styles.brandText}>Form Builder</span>
            </div>
            <span className={styles.breadcrumbSeparator}>→</span>
            <span className={styles.breadcrumbText}>Create Form</span>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="outline"
              onClick={handleSave}
              className={styles.saveButton}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as draft
            </Button>
            <Button onClick={handlePublish} className={styles.publishButton}>
              <Eye className="w-4 h-4 mr-2" />
              Publish Form
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="configuration" className={styles.tabTrigger}>
              <Settings className="w-4 h-4" />
              Form Configuration
            </TabsTrigger>
            <TabsTrigger value="preview" className={styles.tabTrigger}>
              <Eye className="w-4 h-4" />
              Form Layout
            </TabsTrigger>
            <TabsTrigger value="response" className={styles.tabTrigger}>
              <MessageSquare className="w-4 h-4" />
              Form Response
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Tabs value={activeTab} className={styles.tabContent}>
          {activeTab === "configuration" && <TabsContent value="configuration" className={styles.tabContent}>
            <FieldsSidebar onFieldAdd={handleFieldAdd} />
            <FormCanvas
              schema={schema}
              onSchemaChange={handleSchemaChange}
              selectedField={selectedField}
              onFieldSelect={setSelectedField}
            />
          </TabsContent>}

          {activeTab === "preview" && <TabsContent value="preview" className={styles.tabContent}>
            <div className={styles.layoutContent}>
              <div className="mb-6 text-center">
                <div className={styles.previewBadge}>
                  <Eye className="w-4 h-4" />
                  Preview Form
                </div>
              </div>
              <FormRenderer
                schema={schema}
                mode="preview"
                className={styles.previewContainer}
              />
            </div>
          </TabsContent>
          }

          {activeTab === "response" &&<TabsContent value="response" className={styles.tabContent}>
            <div className={styles.layoutContent}>
              <div className="mb-6 text-center">
                <div className={styles.previewBadge}>
                  <MessageSquare className="w-4 h-4" />
                  Test Form Response
                </div>
              </div>
              <FormRenderer
                schema={schema}
                mode="response"
                onSubmit={handleFormSubmit}
                className={styles.previewContainer}
              />
            </div>
          </TabsContent>
          }
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className={styles.bottomActions}>
        <div className={styles.bottomContent}>
          <Button
            variant="ghost"
            className={styles.previewFormButton}
            onClick={() => setActiveTab("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Form
          </Button>

          <div className={styles.bottomActionButtons}>
            <Button variant="outline" onClick={handleSave}>
              Save as draft
            </Button>
            <Button className={styles.publishButton} onClick={handlePublish}>
              Publish Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
