import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./FileUpload";
import { useState } from "react";
import { Stack } from "../Layout/Layout";
import { Page } from "../Page/Page";

const meta: Meta<typeof FileUpload> = {
  title: "Design System/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload label="Upload Files" onChange={setFiles} />
        </Stack>
      </Page>
    );
  },
};

export const WithHelperText: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Profile Picture"
            helperText="Upload a profile picture. Recommended size: 400x400px"
            onChange={setFiles}
          />
        </Stack>
      </Page>
    );
  },
};

export const WithFileTypeRestriction: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Upload Images"
            accept="image/*"
            onChange={setFiles}
            helperText="Only image files are accepted"
          />
        </Stack>
      </Page>
    );
  },
};

export const WithSizeLimit: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Upload Document"
            accept=".pdf,.doc,.docx"
            maxSize={5 * 1024 * 1024} // 5MB
            onChange={setFiles}
            helperText="Only PDF, DOC, and DOCX files are accepted. Maximum size: 5MB"
          />
        </Stack>
      </Page>
    );
  },
};

export const MultipleFiles: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Upload Multiple Files"
            multiple
            onChange={setFiles}
            helperText="You can select or drag multiple files"
          />
        </Stack>
      </Page>
    );
  },
};

export const Required: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Required Upload"
            required
            onChange={setFiles}
            helperText="This field is required"
          />
        </Stack>
      </Page>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Upload Resume"
            onChange={setFiles}
            error
            errorMessage="Please upload a valid file"
          />
        </Stack>
      </Page>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload label="Disabled Upload" disabled />
        </Stack>
      </Page>
    );
  },
};

export const WithPreselectedFiles: Story = {
  render: () => {
    // Simulate pre-selected files
    const mockFile = new File(["content"], "example.pdf", {
      type: "application/pdf",
    });
    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Edit Attachments"
            defaultFiles={[mockFile]}
            multiple
            helperText="You can add more files or remove existing ones"
          />
        </Stack>
      </Page>
    );
  },
};

export const UploadingState: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <Page>
        <Stack gap="var(--spacing-lg)" style={{ maxWidth: "600px" }}>
          <FileUpload
            label="Uploading State Debug"
            forceActive={true}
            onChange={setFiles}
          />
        </Stack>
      </Page>
    );
  },
};
