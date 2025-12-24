import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./FileUpload";
import { useState } from "react";

const meta: Meta<typeof FileUpload> = {
  title: "Components/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload label="Upload Files" onChange={setFiles} />
      </div>
    );
  },
};

export const WithHelperText: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Profile Picture"
          helperText="Upload a profile picture. Recommended size: 400x400px"
          onChange={setFiles}
        />
      </div>
    );
  },
};

export const WithFileTypeRestriction: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Upload Images"
          accept="image/*"
          onChange={setFiles}
          helperText="Only image files are accepted"
        />
      </div>
    );
  },
};

export const WithSizeLimit: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Upload Document"
          accept=".pdf,.doc,.docx"
          maxSize={5 * 1024 * 1024} // 5MB
          onChange={setFiles}
          helperText="Only PDF, DOC, and DOCX files are accepted. Maximum size: 5MB"
        />
      </div>
    );
  },
};

export const MultipleFiles: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Upload Multiple Files"
          multiple
          onChange={setFiles}
          helperText="You can select or drag multiple files"
        />
      </div>
    );
  },
};

export const Required: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Required Upload"
          required
          onChange={setFiles}
          helperText="This field is required"
        />
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Upload Resume"
          onChange={setFiles}
          error
          errorMessage="Please upload a valid file"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ width: "600px", maxWidth: "95vw" }}>
      <FileUpload label="Disabled Upload" disabled />
    </div>
  ),
};

export const WithPreselectedFiles: Story = {
  render: () => {
    // Simulate pre-selected files
    const mockFile = new File(["content"], "example.pdf", {
      type: "application/pdf",
    });
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Edit Attachments"
          defaultFiles={[mockFile]}
          multiple
          helperText="You can add more files or remove existing ones"
        />
      </div>
    );
  },
};

export const WithPreview: Story = {
  render: () => {
    // Simulate pre-selected image files
    const mockImage = new File(["content"], "beach.jpg", {
      type: "image/jpeg",
    });
    const mockDoc = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });

    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Image Gallery Upload"
          showPreview
          defaultFiles={[mockImage, mockDoc]}
          multiple
          helperText="Images will show a thumbnail preview"
        />
      </div>
    );
  },
};

export const UploadingState: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div style={{ width: "600px", maxWidth: "95vw" }}>
        <FileUpload
          label="Uploading State Debug"
          forceActive={true}
          onChange={setFiles}
        />
      </div>
    );
  },
};
