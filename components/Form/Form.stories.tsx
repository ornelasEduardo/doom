import type { Meta, StoryObj } from "@storybook/react";
import { Form, Field, FormMessage } from "./Form";
import {
  Input,
  Button,
  Switch,
  Select,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Label,
  Checkbox,
  Card,
} from "../..";
import React from "react";

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
          label="Email Address"
          htmlFor="email"
          description="We'll never share your email."
        >
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
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
      console.log("Form submitted:", formData);
      alert("Form submitted! Check console for data.");
    };

    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Card style={{ padding: "2rem", width: "100%", maxWidth: "480px" }}>
          <Form onSubmit={handleSubmit}>
            <Field label="Full Name" htmlFor="name" required>
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
              label="Email"
              htmlFor="email"
              description="Your primary contact email"
              required
            >
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Field>

            <Field label="Role" htmlFor="role" required>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                options={[
                  { value: "", label: "Select a role..." },
                  { value: "developer", label: "Developer" },
                  { value: "designer", label: "Designer" },
                  { value: "manager", label: "Manager" },
                  { value: "other", label: "Other" },
                ]}
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
              label="Bio"
              htmlFor="bio"
              description="Tell us about yourself"
            >
              <Textarea
                id="bio"
                placeholder="I'm a developer who loves..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
              />
            </Field>

            <Field label="Notification Volume" htmlFor="volume">
              <Slider
                id="volume"
                value={formData.volume}
                onChange={(value) =>
                  setFormData({ ...formData, volume: value })
                }
                showValue
                min={0}
                max={100}
              />
            </Field>

            <Field>
              <Switch
                label="Enable email notifications"
                checked={formData.notifications}
                onChange={(checked) =>
                  setFormData({ ...formData, notifications: checked })
                }
              />
            </Field>

            <Field>
              <Checkbox
                label="I agree to the Terms and Conditions"
                checked={formData.terms}
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
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        alert("Form submitted successfully!");
      }
    };

    return (
      <Form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <Field
          label="Email Address"
          htmlFor="email-validation"
          error={errors.email}
          required
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
                if (error) next.email = error;
                else delete next.email;
                return next;
              });
            }}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password-validation"
          error={errors.password}
          description="Must be at least 8 characters with one uppercase letter"
          required
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
                if (error) next.password = error;
                else delete next.password;
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
            <Label htmlFor="first-name" required>
              First Name
            </Label>
            <Input id="first-name" placeholder="John" />
            <FormMessage>Legal first name</FormMessage>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <Label htmlFor="last-name" required>
              Last Name
            </Label>
            <Input id="last-name" placeholder="Doe" />
          </div>
        </div>

        <Field label="Email" htmlFor="email-custom">
          <Input
            id="email-custom"
            type="email"
            placeholder="john.doe@example.com"
          />
        </Field>

        <Field label="Bio" htmlFor="bio-custom">
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
