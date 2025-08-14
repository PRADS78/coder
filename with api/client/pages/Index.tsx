import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormInput,
  Eye,
  Zap,
  GripVertical,
  Copy,
  Settings,
  FileText,
  Calendar,
  ChevronDown,
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Build Forms
              <span className="text-indigo-600"> Effortlessly</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create powerful, interactive forms with our intuitive
              drag-and-drop builder. Design, customize, and deploy forms in
              minutes, not hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8 py-3 text-lg">
                <Link to="/form-builder">
                  <FormInput className="w-5 h-5 mr-2" />
                  Start Building
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg"
              >
                <Link to="/form-preview/demo">
                  <Eye className="w-5 h-5 mr-2" />
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build amazing forms
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features that make form building simple and efficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <GripVertical className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Drag & Drop Builder</CardTitle>
                <CardDescription>
                  Intuitive drag-and-drop interface for effortless form creation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Inline Editing</CardTitle>
                <CardDescription>
                  Click to edit any field instantly with smart inline controls
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Copy className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Clone & Duplicate</CardTitle>
                <CardDescription>
                  Quickly clone fields and sections to speed up form building
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Rich Field Types</CardTitle>
                <CardDescription>
                  Text, dropdowns, dates, file uploads, and custom UDF fields
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Smart Validation</CardTitle>
                <CardDescription>
                  Built-in validation with custom rules and error messages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See your form in action with real-time preview mode
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Field Types Preview */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Field Types
            </h2>
            <p className="text-lg text-gray-600">
              Choose from a variety of input types and UDF fields
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: FileText, label: "Short Text", color: "blue" },
              { icon: FileText, label: "Long Text", color: "purple" },
              { icon: Calendar, label: "Date Picker", color: "green" },
              { icon: ChevronDown, label: "Dropdown", color: "orange" },
              { icon: FormInput, label: "Number", color: "pink" },
              { icon: FileText, label: "File Upload", color: "indigo" },
            ].map((field, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center border-2 hover:border-indigo-200 transition-colors"
              >
                <div
                  className={`w-12 h-12 bg-${field.color}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}
                >
                  <field.icon className={`w-6 h-6 text-${field.color}-600`} />
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  {field.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to build your first form?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start creating professional forms in minutes with our powerful form
            builder
          </p>
          <Button asChild size="lg" className="px-8 py-3 text-lg">
            <Link to="/form-builder">
              <FormInput className="w-5 h-5 mr-2" />
              Get Started Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
