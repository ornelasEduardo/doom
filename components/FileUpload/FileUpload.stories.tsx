import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { FileUpload } from "./FileUpload";

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
          helperText="Upload a profile picture. Recommended size: 400x400px"
          label="Profile Picture"
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
          accept="image/*"
          helperText="Only image files are accepted"
          label="Upload Images"
          onChange={setFiles}
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
          accept=".pdf,.doc,.docx"
          helperText="Only PDF, DOC, and DOCX files are accepted. Maximum size: 5MB"
          label="Upload Document"
          maxSize={5 * 1024 * 1024} // 5MB
          onChange={setFiles}
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
          multiple
          helperText="You can select or drag multiple files"
          label="Upload Multiple Files"
          onChange={setFiles}
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
          required
          helperText="This field is required"
          label="Required Upload"
          onChange={setFiles}
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
          error
          errorMessage="Please upload a valid file"
          label="Upload Resume"
          onChange={setFiles}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ width: "600px", maxWidth: "95vw" }}>
      <FileUpload disabled label="Disabled Upload" />
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
          multiple
          defaultFiles={[mockFile]}
          helperText="You can add more files or remove existing ones"
          label="Edit Attachments"
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
          multiple
          showPreview
          defaultFiles={[mockImage, mockDoc]}
          helperText="Images will show a thumbnail preview"
          label="Image Gallery Upload"
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
          forceActive={true}
          label="Uploading State Debug"
          onChange={setFiles}
        />
      </div>
    );
  },
};
