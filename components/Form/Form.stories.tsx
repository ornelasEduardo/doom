import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  Slider,
  Switch,
  Textarea,
} from "../..";
import { Field, Form, FormMessage } from "./Form";

const meta: Meta<typeof Form> = {
  title: "Components/Form",
  component: Form,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    const [email, setEmail] = React.useState("");

    return (
      <Form onSubmit={(e) => e.preventDefault()}>
        <Field
          description="We'll never share your email."
          htmlFor="email"
          label="Email Address"
        >
          <Input
            id="email"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field required htmlFor="password" label="Password">
          <Input
            id="password"
            placeholder="Enter your password"
            type="password"
          />
        </Field>

        <Field>
          <Switch label="Remember me" />
        </Field>

        <Button type="submit">Submit</Button>
      </Form>
    );
  },
};

export const ComprehensiveForm: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      name: "",
      email: "",
      role: "",
      plan: "free",
      bio: "",
      volume: 50,
      notifications: true,
      terms: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Form submitted! Check console for data.");
    };

    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Card style={{ padding: "2rem", width: "100%", maxWidth: "480px" }}>
          <Form onSubmit={handleSubmit}>
            <Field required htmlFor="name" label="Full Name">
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Field>

            <Field
              required
              description="Your primary contact email"
              htmlFor="email"
              label="Email"
            >
              <Input
                id="email"
                placeholder="john@example.com"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Field>

            <Field required htmlFor="role" label="Role">
              <Select
                id="role"
                options={[
                  { value: "", label: "Select a role..." },
                  { value: "developer", label: "Developer" },
                  { value: "designer", label: "Designer" },
                  { value: "manager", label: "Manager" },
                  { value: "other", label: "Other" },
                ]}
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </Field>

            <Field label="Subscription Plan">
              <RadioGroup
                value={formData.plan}
                onValueChange={(value) =>
                  setFormData({ ...formData, plan: value })
                }
              >
                <RadioGroupItem value="free">Free - $0/month</RadioGroupItem>
                <RadioGroupItem value="pro">Pro - $19/month</RadioGroupItem>
                <RadioGroupItem value="enterprise">
                  Enterprise - $99/month
                </RadioGroupItem>
              </RadioGroup>
            </Field>

            <Field
              description="Tell us about yourself"
              htmlFor="bio"
              label="Bio"
            >
              <Textarea
                id="bio"
                placeholder="I'm a developer who loves..."
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </Field>

            <Field htmlFor="volume" label="Notification Volume">
              <Slider
                showValue
                id="volume"
                max={100}
                min={0}
                value={formData.volume}
                onChange={(value) =>
                  setFormData({ ...formData, volume: value as number })
                }
              />
            </Field>

            <Field>
              <Switch
                checked={formData.notifications}
                label="Enable email notifications"
                onChange={(checked) =>
                  setFormData({ ...formData, notifications: checked })
                }
              />
            </Field>

            <Field>
              <Checkbox
                checked={formData.terms}
                label="I agree to the Terms and Conditions"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, terms: e.target.checked })
                }
              />
            </Field>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <Button type="submit" variant="primary">
                Create Account
              </Button>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    );
  },
};

export const WithValidation: Story = {
  render: () => {
    const [email, setEmail] = React.useState("bad-email@");
    const [password, setPassword] = React.useState("");
    const [errors, setErrors] = React.useState<Record<string, string>>({
      email: "Invalid email address",
    });

    const validateEmail = (value: string) => {
      if (!value.includes("@") || !value.includes(".")) {
        return "Please enter a valid email address";
      }
      if (value.length < 5) {
        return "Email is too short";
      }
      return undefined;
    };

    const validatePassword = (value: string) => {
      if (value.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter";
      }
      return undefined;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      const newErrors: Record<string, string> = {};
      if (emailError) {
        newErrors.email = emailError;
      }
      if (passwordError) {
        newErrors.password = passwordError;
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        alert("Form submitted successfully!");
      }
    };

    return (
      <Form style={{ maxWidth: "500px" }} onSubmit={handleSubmit}>
        <Field
          required
          error={errors.email}
          htmlFor="email-validation"
          label="Email Address"
        >
          <Input
            id="email-validation"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              const error = validateEmail(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                if (error) {
                  next.email = error;
                } else {
                  delete next.email;
                }
                return next;
              });
            }}
          />
        </Field>

        <Field
          required
          description="Must be at least 8 characters with one uppercase letter"
          error={errors.password}
          htmlFor="password-validation"
          label="Password"
        >
          <Input
            id="password-validation"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              const error = validatePassword(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                if (error) {
                  next.password = error;
                } else {
                  delete next.password;
                }
                return next;
              });
            }}
          />
        </Field>

        <Button
          type="submit"
          variant={Object.keys(errors).length > 0 ? "secondary" : "primary"}
        >
          {Object.keys(errors).length > 0 ? "Fix Errors" : "Submit"}
        </Button>
      </Form>
    );
  },
};

export const CustomLayout: Story = {
  render: () => {
    return (
      <Form style={{ maxWidth: "800px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <Label required htmlFor="first-name">
              First Name
            </Label>
            <Input id="first-name" placeholder="John" />
            <FormMessage>Legal first name</FormMessage>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <Label required htmlFor="last-name">
              Last Name
            </Label>
            <Input id="last-name" placeholder="Doe" />
          </div>
        </div>

        <Field htmlFor="email-custom" label="Email">
          <Input
            id="email-custom"
            placeholder="john.doe@example.com"
            type="email"
          />
        </Field>

        <Field htmlFor="bio-custom" label="Bio">
          <Textarea
            id="bio-custom"
            placeholder="Tell us about yourself..."
            rows={4}
          />
          <FormMessage variant="error">Bio cannot be empty</FormMessage>
        </Field>

        <div style={{ marginTop: "1rem" }}>
          <Button type="submit">Save Profile</Button>
        </div>
      </Form>
    );
  },
};
