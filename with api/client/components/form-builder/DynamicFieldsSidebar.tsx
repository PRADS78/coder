import { useState, useEffect } from "react";
import {
  configService,
  getFieldsByCategory,
  loadFormConfig,
  FieldDefinition,
} from "@/lib/config-service";
import { useDragAndDrop, createDragItem } from "@/hooks/useDragAndDrop";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicFieldsSidebarProps {
  onFieldAdd: (fieldType: string) => void;
}

export const DynamicFieldsSidebar: React.FC<DynamicFieldsSidebarProps> = ({
  onFieldAdd,
}) => {
  const [activeTab, setActiveTab] = useState<"input" | "udf">("input");
  const [searchQuery, setSearchQuery] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [inputFields, setInputFields] = useState<FieldDefinition[]>([]);
  const [udfFields, setUdfFields] = useState<FieldDefinition[]>([]);

  const { onDragStart, onDragEnd } = useDragAndDrop();

  // Load configuration and fields on mount
  useEffect(() => {
    const initializeFields = async () => {
      try {
        await loadFormConfig();

        const inputFieldDefs = getFieldsByCategory("input");
        const udfFieldDefs = getFieldsByCategory("udf");

        setInputFields(inputFieldDefs);
        setUdfFields(udfFieldDefs);
        setConfigLoaded(true);

        console.log("✅ Dynamic fields loaded:", {
          input: inputFieldDefs.length,
          udf: udfFieldDefs.length,
        });
      } catch (error) {
        console.error("❌ Failed to load fields configuration:", error);
        setConfigLoaded(true); // Still show UI with empty fields
      }
    };

    initializeFields();
  }, []);

  // Filter fields based on search query
  const filteredInputFields = inputFields.filter((field) =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredUdfFields = udfFields.filter((field) =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFieldDragStart = (e: React.DragEvent, fieldType: string) => {
    const dragItem = createDragItem(fieldType, "field-type", { fieldType });
    onDragStart(e, dragItem);
  };

  const renderFieldItem = (field: FieldDefinition) => {
    return (
      <div
        key={field.type}
        draggable
        onDragStart={(e) => handleFieldDragStart(e, field.type)}
        onDragEnd={onDragEnd}
        onClick={() => onFieldAdd(field.type)}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border border-gray-200",
          "cursor-grab active:cursor-grabbing hover:border-blue-300 hover:bg-blue-50",
          "transition-all duration-200",
        )}
      >
        <div className="text-lg">{field.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700">
            {field.label}
          </div>
          {field.description && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {field.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFieldsList = (fields: FieldDefinition[]) => {
    if (!configLoaded) {
      // Show loading skeletons
      return (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (fields.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <p className="text-gray-500 text-sm">
            {searchQuery
              ? "No fields match your search"
              : "No fields available"}
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-blue-600"
            >
              Clear search
            </Button>
          )}
        </div>
      );
    }

    return <div className="space-y-3">{fields.map(renderFieldItem)}</div>;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">Form Elements</h2>
          {configService.isLoadedFromBlob() && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Dynamic
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Configuration Status */}
      {configLoaded && (
        <div className="px-4 py-2 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>
              {configService.isLoadedFromBlob()
                ? "Loaded from blob"
                : "Using fallback"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-6 px-2 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "input" | "udf")}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="input" className="text-xs">
                Input Fields
                {configLoaded && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {filteredInputFields.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="udf" className="text-xs">
                UDF Fields
                {configLoaded && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {filteredUdfFields.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="input" className="p-4 mt-0">
              {renderFieldsList(filteredInputFields)}
            </TabsContent>

            <TabsContent value="udf" className="p-4 mt-0">
              {renderFieldsList(filteredUdfFields)}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 Drag fields to the canvas</div>
          <div>⚙️ Fields loaded from configuration</div>
          {!configService.isLoadedFromBlob() && (
            <div className="text-amber-600">
              ⚠️ Using fallback configuration
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
