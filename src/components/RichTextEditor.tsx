import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, List, ListOrdered, Heading2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Sync content back
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: Underline, command: "underline", label: "Underline" },
    { icon: Heading2, command: "formatBlock", value: "h3", label: "Heading" },
    { icon: List, command: "insertUnorderedList", label: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
  ];

  return (
    <div className={cn("border border-input rounded-md overflow-hidden bg-background", className)}>
      <div className="flex items-center gap-0.5 p-1.5 border-b border-input bg-muted/50">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.command + (btn.value || "")}
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.preventDefault();
              execCommand(btn.command, btn.value);
            }}
            title={btn.label}
          >
            <btn.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[100px] px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || "" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
