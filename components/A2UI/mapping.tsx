import React from "react";

// Data Display
import { Accordion, AccordionItem } from "../Accordion/Accordion";
// Actions
import { ActionRow } from "../ActionRow/ActionRow";
// Primitives - Static display components
import { Alert } from "../Alert/Alert";
import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";
// Navigation
import { BreadcrumbItem, Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Checkbox } from "../Checkbox/Checkbox";
import { Chip } from "../Chip/Chip";
// Layout
import { Combobox } from "../Combobox/Combobox";
import { Image } from "../Image/Image";
import { Input } from "../Input/Input";
import { Label } from "../Label/Label";
import { Container, Flex, Grid, Stack, Switcher } from "../Layout/Layout";
import { Link } from "../Link/Link";
// Feedback - Static display
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { RadioGroup, RadioGroupItem } from "../RadioGroup/RadioGroup";
import { Select } from "../Select/Select";
import { Skeleton } from "../Skeleton/Skeleton";
import { Slat } from "../Slat/Slat";
import { Slider } from "../Slider/Slider";
import { Spinner } from "../Spinner/Spinner";
import { SplitButton } from "../SplitButton/SplitButton";
import { Switch } from "../Switch/Switch";
import { Table } from "../Table/Table";
import {
  Tabs,
  TabsBody,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../Tabs/Tabs";
import { Text } from "../Text/Text";
import { Textarea } from "../Textarea/Textarea";
import { Tooltip } from "../Tooltip/Tooltip";
// Wrappers (for components needing JSON-to-function adaptation)
import { ChartWrapper } from "./wrappers";

export const componentMap: Record<string, React.ElementType> = {
  // Primitives
  alert: Alert,
  avatar: Avatar,
  badge: Badge,
  button: Button,
  card: Card,
  checkbox: Checkbox,
  chip: Chip,
  combobox: Combobox,
  input: Input,
  label: Label,
  link: Link,
  "radio-group": RadioGroup,
  "radio-group-item": RadioGroupItem,
  slider: Slider,
  spinner: Spinner,
  switch: Switch,
  text: Text,
  textarea: Textarea,
  tooltip: Tooltip,

  // Layout
  box: "div",
  container: Container,
  flex: Flex,
  grid: Grid,
  layout: "div",
  stack: Stack,
  switcher: Switcher,

  // Navigation
  breadcrumbs: Breadcrumbs,
  "breadcrumb-item": BreadcrumbItem,
  tabs: Tabs,
  "tabs-body": TabsBody,
  "tabs-content": TabsContent,
  "tabs-list": TabsList,
  "tabs-trigger": TabsTrigger,

  // Feedback
  "progress-bar": ProgressBar,
  skeleton: Skeleton,

  // Data Display
  accordion: Accordion,
  "accordion-item": AccordionItem,
  chart: ChartWrapper,
  image: Image,
  select: Select,
  slat: Slat,
  table: Table,

  // Actions
  "action-row": ActionRow,
  "split-button": SplitButton,
};
