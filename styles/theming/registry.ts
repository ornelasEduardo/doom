/** Public recipe targets and supported visual props. */
export const componentRegistry = {
  Accordion: {
    parts: [
      "root",
      "contentBody",
      "contentWrapper",
      "header",
      "icon",
      "item",
      "trigger",
    ],
    variants: [],
    sizes: [],
  },
  ActionRow: { parts: ["root", "iconWrapper"], variants: [], sizes: [] },
  Alert: {
    parts: ["root", "content", "description", "iconWrapper", "title"],
    variants: ["info", "success", "warning", "error"],
    sizes: [],
  },
  Avatar: {
    parts: ["root", "fallback", "image"],
    variants: [],
    sizes: ["sm", "md", "lg", "xl"],
  },
  Badge: {
    parts: ["root"],
    variants: [
      "primary",
      "success",
      "warning",
      "error",
      "secondary",
      "outline",
    ],
    sizes: ["sm", "md", "lg"],
  },
  Box: { parts: ["root"], variants: [], sizes: [] },
  Breadcrumbs: {
    parts: ["root", "currentPage", "li", "list"],
    variants: [],
    sizes: [],
  },
  Button: {
    parts: ["root", "label", "spinner"],
    variants: ["primary", "secondary", "ghost", "outline", "success", "danger"],
    sizes: ["sm", "md", "lg"],
  },
  Card: {
    parts: ["root", "body", "footer", "header", "padded"],
    variants: [],
    sizes: [],
  },
  Chart: {
    parts: [
      "root",
      "area",
      "axes",
      "bar",
      "cursorLine",
      "domain",
      "dragGhost",
      "dragLine",
      "dragPuck",
      "footer",
      "grid",
      "gridLine",
      "header",
      "label",
      "legend",
      "legendDot",
      "legendItem",
      "legendLabel",
      "marker",
      "path",
      "plot",
      "point",
      "responsiveWrapper",
      "srOnly",
      "subtitle",
      "svg",
      "tickLabel",
      "tickLine",
      "tooltipCard",
      "tooltipLabel",
      "tooltipList",
      "tooltipRow",
      "tooltipSeriesLabel",
      "tooltipSwatch",
      "tooltipValue",
      "tooltipWrapper",
    ],
    variants: ["default", "solid"],
    sizes: [],
  },
  Checkbox: {
    parts: [
      "root",
      "checkboxDisplay",
      "checkboxInput",
      "icon",
      "labelOverride",
    ],
    variants: [],
    sizes: [],
  },
  Chip: {
    parts: ["root", "content", "dismissButton"],
    variants: ["default", "primary", "success", "warning", "error"],
    sizes: ["xs", "sm", "md", "lg", "xl"],
  },
  Combobox: {
    parts: [
      "root",
      "chevron",
      "clearButton",
      "dropdown",
      "noResults",
      "noResultsText",
      "option",
      "optionLabel",
      "optionsList",
      "searchIcon",
      "searchInput",
      "searchWrapper",
      "stickyOption",
      "triggerIcons",
      "triggerText",
    ],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Container: { parts: ["root"], variants: [], sizes: [] },
  CopyButton: {
    parts: [
      "root",
      "defaultLabel",
      "labelContainer",
      "measureItem",
      "successLabel",
      "widthPreserver",
    ],
    variants: ["primary", "secondary", "ghost", "outline", "success", "danger"],
    sizes: ["sm", "md", "lg"],
  },
  Drawer: {
    parts: ["root", "content", "footer", "header", "headerContent", "panel"],
    variants: ["default", "solid"],
    sizes: [],
  },
  Dropdown: {
    parts: ["root", "item", "menu"],
    variants: ["primary", "secondary"],
    sizes: ["sm", "md", "lg"],
  },
  FileUpload: {
    parts: [
      "root",
      "body",
      "emptyState",
      "errorText",
      "fileList",
      "header",
      "headerContent",
      "headerTitle",
      "helperText",
      "hiddenInput",
      "icon",
      "previewImg",
      "previewWrapper",
      "removeButton",
      "requiredMark",
      "secondary",
      "starField",
      "voidIconWrapper",
      "voidText",
    ],
    variants: [],
    sizes: [],
  },
  Flex: { parts: ["root"], variants: [], sizes: [] },
  Form: {
    parts: ["root", "label", "field", "message"],
    variants: ["error", "description"],
    sizes: [],
  },
  Grid: { parts: ["root"], variants: [], sizes: [] },
  Icon: { parts: ["root"], variants: [], sizes: [] },
  Image: { parts: ["root", "image", "skeletonLayer"], variants: [], sizes: [] },
  Input: {
    parts: [
      "root",
      "label",
      "adornment",
      "bottomRow",
      "counter",
      "helperText",
      "input",
      "messageArea",
      "wrapper",
    ],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Label: { parts: ["root"], variants: [], sizes: [] },
  Link: {
    parts: ["root"],
    variants: ["default", "button", "subtle"],
    sizes: [],
  },
  Modal: {
    parts: [
      "root",
      "body",
      "closeButton",
      "contentContainer",
      "footer",
      "header",
      "headerContent",
      "modalCard",
      "modalContent",
    ],
    variants: ["default", "solid"],
    sizes: [],
  },
  Page: { parts: ["root"], variants: ["default", "fullWidth"], sizes: [] },
  Pagination: {
    parts: ["root", "button", "ellipsis"],
    variants: [],
    sizes: [],
  },
  Popover: { parts: ["root", "triggerWrapper"], variants: [], sizes: [] },
  ProgressBar: {
    parts: ["root", "container", "fill", "stripes"],
    variants: [],
    sizes: [],
  },
  RadioGroup: {
    parts: [
      "root",
      "hiddenInput",
      "innerDot",
      "itemLabel",
      "labelText",
      "radioCircle",
    ],
    variants: [],
    sizes: [],
  },
  Rating: {
    parts: ["root", "icon", "iconButton", "iconWrapper", "radioButton"],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Select: {
    parts: ["root", "label", "option", "optionsList", "trigger"],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Sheet: {
    parts: [
      "root",
      "content",
      "footer",
      "handleBar",
      "header",
      "headerBody",
      "headerContent",
      "panel",
    ],
    variants: ["default", "solid"],
    sizes: [],
  },
  Sidebar: {
    parts: [
      "root",
      "footer",
      "frame",
      "header",
      "item",
      "itemAppend",
      "itemIcon",
      "itemLabel",
      "mobilePanel",
      "mobileTrigger",
      "nav",
      "overlay",
      "panel",
      "rail",
      "railBrand",
      "railItem",
      "railNav",
      "section",
      "sectionChevron",
      "sectionContent",
      "sectionIcon",
      "sectionLabel",
      "sectionTrigger",
    ],
    variants: [],
    sizes: [],
  },
  Skeleton: {
    parts: ["root"],
    variants: ["text", "circular", "rectangular"],
    sizes: [],
  },
  Slat: {
    parts: ["root", "append", "label", "prepend", "secondaryLabel"],
    variants: ["default", "danger", "success"],
    sizes: [],
  },
  Slider: {
    parts: [
      "root",
      "label",
      "labelRow",
      "multiRangeInput",
      "progressFill",
      "rangeInput",
      "trackInner",
      "trackWrapper",
      "valueDisplay",
    ],
    variants: [],
    sizes: [],
  },
  Spinner: { parts: ["root"], variants: [], sizes: ["sm", "md", "lg", "xl"] },
  SplitButton: {
    parts: ["root", "dropdownTrigger", "item", "mainButton", "menu"],
    variants: ["primary", "secondary"],
    sizes: ["sm", "md", "lg"],
  },
  Stack: { parts: ["root"], variants: [], sizes: [] },
  Switch: {
    parts: ["root", "input", "label", "toggle"],
    variants: [],
    sizes: [],
  },
  Switcher: { parts: ["root"], variants: [], sizes: [] },
  Table: {
    parts: [
      "root",
      "actionsWrapper",
      "controls",
      "expandToggle",
      "expandToggleIcon",
      "expandedRow",
      "filterBar",
      "filterCount",
      "filterItem",
      "headerContent",
      "headerGroup",
      "noResults",
      "paginationContainer",
      "searchBar",
      "searchWrapper",
      "table",
      "tableWrapper",
      "td",
      "th",
      "tr",
    ],
    variants: ["default", "flat"],
    sizes: [],
  },
  Tabs: {
    parts: ["root", "body", "tabsContent", "tabsList", "tabsTrigger"],
    variants: [],
    sizes: [],
  },
  Text: {
    parts: ["root"],
    variants: ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"],
    sizes: [],
  },
  Textarea: {
    parts: [
      "root",
      "label",
      "bottomRow",
      "counter",
      "helperText",
      "messageArea",
      "textarea",
    ],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Toast: {
    parts: ["root", "announcer", "closeButton", "toast"],
    variants: [],
    sizes: [],
  },
  ToggleGroup: {
    parts: ["root", "toggleGroupItem"],
    variants: [],
    sizes: ["sm", "md", "lg"],
  },
  Tooltip: { parts: ["root", "tooltipBody"], variants: [], sizes: [] },
} as const;
export type ComponentName = keyof typeof componentRegistry;
export type PartName<C extends ComponentName> =
  (typeof componentRegistry)[C]["parts"][number];

// Runtime mirrors of csstype Properties<string | 0>, including vendor-prefixed properties.
export const cssProperties = new Set(
  `KhtmlBoxAlign KhtmlBoxDirection KhtmlBoxFlex KhtmlBoxFlexGroup KhtmlBoxLines
KhtmlBoxOrdinalGroup KhtmlBoxOrient KhtmlBoxPack KhtmlLineBreak KhtmlOpacity
KhtmlUserSelect MozAnimation MozAnimationDelay MozAnimationDirection
MozAnimationDuration MozAnimationFillMode MozAnimationIterationCount MozAnimationName
MozAnimationPlayState MozAnimationTimingFunction MozAppearance MozBackfaceVisibility
MozBackgroundClip MozBackgroundOrigin MozBackgroundSize MozBinding MozBorderBottomColors
MozBorderEndColor MozBorderEndStyle MozBorderEndWidth MozBorderImage MozBorderLeftColors
MozBorderRadius MozBorderRadiusBottomleft MozBorderRadiusBottomright
MozBorderRadiusTopleft MozBorderRadiusTopright MozBorderRightColors MozBorderStartColor
MozBorderStartStyle MozBorderTopColors MozBoxAlign MozBoxDirection MozBoxFlex
MozBoxOrdinalGroup MozBoxOrient MozBoxPack MozBoxShadow MozBoxSizing MozColumnCount
MozColumnFill MozColumnRule MozColumnRuleColor MozColumnRuleStyle MozColumnRuleWidth
MozColumnWidth MozColumns MozContextProperties MozFloatEdge MozFontFeatureSettings
MozFontLanguageOverride MozForceBrokenImageIcon MozHyphens MozMarginEnd MozMarginStart
MozOpacity MozOrient MozOsxFontSmoothing MozOutline MozOutlineColor MozOutlineRadius
MozOutlineRadiusBottomleft MozOutlineRadiusBottomright MozOutlineRadiusTopleft
MozOutlineRadiusTopright MozOutlineStyle MozOutlineWidth MozPaddingEnd MozPaddingStart
MozPerspective MozPerspectiveOrigin MozStackSizing MozTabSize MozTextAlignLast
MozTextBlink MozTextDecorationColor MozTextDecorationLine MozTextDecorationStyle
MozTextSizeAdjust MozTransform MozTransformOrigin MozTransformStyle MozTransition
MozTransitionDelay MozTransitionDuration MozTransitionProperty
MozTransitionTimingFunction MozUserFocus MozUserInput MozUserModify MozUserSelect
MozWindowDragging MozWindowShadow OAnimation OAnimationDelay OAnimationDirection
OAnimationDuration OAnimationFillMode OAnimationIterationCount OAnimationName
OAnimationPlayState OAnimationTimingFunction OBackgroundSize OBorderImage OObjectFit
OObjectPosition OTabSize OTextOverflow OTransform OTransformOrigin OTransition
OTransitionDelay OTransitionDuration OTransitionProperty OTransitionTimingFunction
WebkitAlignContent WebkitAlignItems WebkitAlignSelf WebkitAnimation WebkitAnimationDelay
WebkitAnimationDirection WebkitAnimationDuration WebkitAnimationFillMode
WebkitAnimationIterationCount WebkitAnimationName WebkitAnimationPlayState
WebkitAnimationTimingFunction WebkitAppearance WebkitBackdropFilter
WebkitBackfaceVisibility WebkitBackgroundClip WebkitBackgroundOrigin
WebkitBackgroundSize WebkitBorderBefore WebkitBorderBeforeColor WebkitBorderBeforeStyle
WebkitBorderBeforeWidth WebkitBorderBottomLeftRadius WebkitBorderBottomRightRadius
WebkitBorderImage WebkitBorderImageSlice WebkitBorderRadius WebkitBorderTopLeftRadius
WebkitBorderTopRightRadius WebkitBoxAlign WebkitBoxDecorationBreak WebkitBoxDirection
WebkitBoxFlex WebkitBoxFlexGroup WebkitBoxLines WebkitBoxOrdinalGroup WebkitBoxOrient
WebkitBoxPack WebkitBoxReflect WebkitBoxShadow WebkitBoxSizing WebkitClipPath
WebkitColumnCount WebkitColumnFill WebkitColumnRule WebkitColumnRuleColor
WebkitColumnRuleStyle WebkitColumnRuleWidth WebkitColumnSpan WebkitColumnWidth
WebkitColumns WebkitFilter WebkitFlex WebkitFlexBasis WebkitFlexDirection WebkitFlexFlow
WebkitFlexGrow WebkitFlexShrink WebkitFlexWrap WebkitFontFeatureSettings
WebkitFontKerning WebkitFontSmoothing WebkitFontVariantLigatures
WebkitHyphenateCharacter WebkitHyphens WebkitInitialLetter WebkitJustifyContent
WebkitLineBreak WebkitLineClamp WebkitLogicalHeight WebkitLogicalWidth WebkitMarginEnd
WebkitMarginStart WebkitMask WebkitMaskAttachment WebkitMaskBoxImage
WebkitMaskBoxImageOutset WebkitMaskBoxImageRepeat WebkitMaskBoxImageSlice
WebkitMaskBoxImageSource WebkitMaskBoxImageWidth WebkitMaskClip WebkitMaskComposite
WebkitMaskImage WebkitMaskOrigin WebkitMaskPosition WebkitMaskPositionX
WebkitMaskPositionY WebkitMaskRepeat WebkitMaskRepeatX WebkitMaskRepeatY WebkitMaskSize
WebkitMaxInlineSize WebkitOrder WebkitOverflowScrolling WebkitPaddingEnd
WebkitPaddingStart WebkitPerspective WebkitPerspectiveOrigin WebkitPrintColorAdjust
WebkitRubyPosition WebkitScrollSnapType WebkitShapeMargin WebkitTapHighlightColor
WebkitTextCombine WebkitTextDecorationColor WebkitTextDecorationLine
WebkitTextDecorationSkip WebkitTextDecorationStyle WebkitTextEmphasis
WebkitTextEmphasisColor WebkitTextEmphasisPosition WebkitTextEmphasisStyle
WebkitTextFillColor WebkitTextOrientation WebkitTextSizeAdjust WebkitTextStroke
WebkitTextStrokeColor WebkitTextStrokeWidth WebkitTextUnderlinePosition
WebkitTouchCallout WebkitTransform WebkitTransformOrigin WebkitTransformStyle
WebkitTransition WebkitTransitionDelay WebkitTransitionDuration WebkitTransitionProperty
WebkitTransitionTimingFunction WebkitUserModify WebkitUserSelect WebkitWritingMode
accentColor alignContent alignItems alignSelf alignTracks alignmentBaseline all
anchorName anchorScope animation animationComposition animationDelay animationDirection
animationDuration animationFillMode animationIterationCount animationName
animationPlayState animationRange animationRangeEnd animationRangeStart
animationTimeline animationTimingFunction appearance aspectRatio backdropFilter
backfaceVisibility background backgroundAttachment backgroundBlendMode backgroundClip
backgroundColor backgroundImage backgroundOrigin backgroundPosition backgroundPositionX
backgroundPositionY backgroundRepeat backgroundSize baselineShift blockSize border
borderBlock borderBlockColor borderBlockEnd borderBlockEndColor borderBlockEndStyle
borderBlockEndWidth borderBlockStart borderBlockStartColor borderBlockStartStyle
borderBlockStartWidth borderBlockStyle borderBlockWidth borderBottom borderBottomColor
borderBottomLeftRadius borderBottomRightRadius borderBottomStyle borderBottomWidth
borderCollapse borderColor borderEndEndRadius borderEndStartRadius borderImage
borderImageOutset borderImageRepeat borderImageSlice borderImageSource borderImageWidth
borderInline borderInlineColor borderInlineEnd borderInlineEndColor borderInlineEndStyle
borderInlineEndWidth borderInlineStart borderInlineStartColor borderInlineStartStyle
borderInlineStartWidth borderInlineStyle borderInlineWidth borderLeft borderLeftColor
borderLeftStyle borderLeftWidth borderRadius borderRight borderRightColor
borderRightStyle borderRightWidth borderSpacing borderStartEndRadius
borderStartStartRadius borderStyle borderTop borderTopColor borderTopLeftRadius
borderTopRightRadius borderTopStyle borderTopWidth borderWidth bottom boxAlign
boxDecorationBreak boxDirection boxFlex boxFlexGroup boxLines boxOrdinalGroup boxOrient
boxPack boxShadow boxSizing breakAfter breakBefore breakInside captionSide caret
caretColor caretShape clear clip clipPath clipRule color colorAdjust colorInterpolation
colorInterpolationFilters colorRendering colorScheme columnCount columnFill columnGap
columnRule columnRuleColor columnRuleStyle columnRuleWidth columnSpan columnWidth
columns contain containIntrinsicBlockSize containIntrinsicHeight
containIntrinsicInlineSize containIntrinsicSize containIntrinsicWidth container
containerName containerType content contentVisibility counterIncrement counterReset
counterSet cursor cx cy d direction display dominantBaseline emptyCells fieldSizing fill
fillOpacity fillRule filter flex flexBasis flexDirection flexFlow flexGrow flexShrink
flexWrap float floodColor floodOpacity font fontFamily fontFeatureSettings fontKerning
fontLanguageOverride fontOpticalSizing fontPalette fontSize fontSizeAdjust fontSmooth
fontStretch fontStyle fontSynthesis fontSynthesisPosition fontSynthesisSmallCaps
fontSynthesisStyle fontSynthesisWeight fontVariant fontVariantAlternates fontVariantCaps
fontVariantEastAsian fontVariantEmoji fontVariantLigatures fontVariantNumeric
fontVariantPosition fontVariationSettings fontWeight fontWidth forcedColorAdjust gap
glyphOrientationVertical grid gridArea gridAutoColumns gridAutoFlow gridAutoRows
gridColumn gridColumnEnd gridColumnGap gridColumnStart gridGap gridRow gridRowEnd
gridRowGap gridRowStart gridTemplate gridTemplateAreas gridTemplateColumns
gridTemplateRows hangingPunctuation height hyphenateCharacter hyphenateLimitChars
hyphens imageOrientation imageRendering imageResolution imeMode initialLetter
initialLetterAlign inlineSize inset insetArea insetBlock insetBlockEnd insetBlockStart
insetInline insetInlineEnd insetInlineStart interpolateSize isolation justifyContent
justifyItems justifySelf justifyTracks left letterSpacing lightingColor lineBreak
lineClamp lineHeight lineHeightStep listStyle listStyleImage listStylePosition
listStyleType margin marginBlock marginBlockEnd marginBlockStart marginBottom
marginInline marginInlineEnd marginInlineStart marginLeft marginRight marginTop
marginTrim marker markerEnd markerMid markerStart mask maskBorder maskBorderMode
maskBorderOutset maskBorderRepeat maskBorderSlice maskBorderSource maskBorderWidth
maskClip maskComposite maskImage maskMode maskOrigin maskPosition maskRepeat maskSize
maskType masonryAutoFlow mathDepth mathShift mathStyle maxBlockSize maxHeight
maxInlineSize maxLines maxWidth minBlockSize minHeight minInlineSize minWidth
mixBlendMode motion motionDistance motionPath motionRotation msAccelerator
msBlockProgression msContentZoomChaining msContentZoomLimit msContentZoomLimitMax
msContentZoomLimitMin msContentZoomSnap msContentZoomSnapPoints msContentZoomSnapType
msContentZooming msFilter msFlex msFlexDirection msFlexPositive msFlowFrom msFlowInto
msGridColumns msGridRows msHighContrastAdjust msHyphenateLimitChars
msHyphenateLimitLines msHyphenateLimitZone msHyphens msImeAlign msImeMode msLineBreak
msOrder msOverflowStyle msOverflowX msOverflowY msScrollChaining msScrollLimit
msScrollLimitXMax msScrollLimitXMin msScrollLimitYMax msScrollLimitYMin msScrollRails
msScrollSnapPointsX msScrollSnapPointsY msScrollSnapType msScrollSnapX msScrollSnapY
msScrollTranslation msScrollbar3dlightColor msScrollbarArrowColor msScrollbarBaseColor
msScrollbarDarkshadowColor msScrollbarFaceColor msScrollbarHighlightColor
msScrollbarShadowColor msScrollbarTrackColor msTextAutospace msTextCombineHorizontal
msTextOverflow msTouchAction msTouchSelect msTransform msTransformOrigin msTransition
msTransitionDelay msTransitionDuration msTransitionProperty msTransitionTimingFunction
msUserSelect msWordBreak msWrapFlow msWrapMargin msWrapThrough msWritingMode objectFit
objectPosition objectViewBox offset offsetAnchor offsetBlock offsetBlockEnd
offsetBlockStart offsetDistance offsetInline offsetInlineEnd offsetInlineStart
offsetPath offsetPosition offsetRotate offsetRotation opacity order orphans outline
outlineColor outlineOffset outlineStyle outlineWidth overflow overflowAnchor
overflowBlock overflowClipBox overflowClipMargin overflowInline overflowWrap overflowX
overflowY overlay overscrollBehavior overscrollBehaviorBlock overscrollBehaviorInline
overscrollBehaviorX overscrollBehaviorY padding paddingBlock paddingBlockEnd
paddingBlockStart paddingBottom paddingInline paddingInlineEnd paddingInlineStart
paddingLeft paddingRight paddingTop page pageBreakAfter pageBreakBefore pageBreakInside
paintOrder perspective perspectiveOrigin placeContent placeItems placeSelf pointerEvents
position positionAnchor positionArea positionTry positionTryFallbacks positionTryOptions
positionTryOrder positionVisibility printColorAdjust quotes r resize right rotate rowGap
rubyAlign rubyMerge rubyOverhang rubyPosition rx ry scale scrollBehavior
scrollInitialTarget scrollMargin scrollMarginBlock scrollMarginBlockEnd
scrollMarginBlockStart scrollMarginBottom scrollMarginInline scrollMarginInlineEnd
scrollMarginInlineStart scrollMarginLeft scrollMarginRight scrollMarginTop scrollPadding
scrollPaddingBlock scrollPaddingBlockEnd scrollPaddingBlockStart scrollPaddingBottom
scrollPaddingInline scrollPaddingInlineEnd scrollPaddingInlineStart scrollPaddingLeft
scrollPaddingRight scrollPaddingTop scrollSnapAlign scrollSnapCoordinate
scrollSnapDestination scrollSnapMargin scrollSnapMarginBottom scrollSnapMarginLeft
scrollSnapMarginRight scrollSnapMarginTop scrollSnapPointsX scrollSnapPointsY
scrollSnapStop scrollSnapType scrollSnapTypeX scrollSnapTypeY scrollTimeline
scrollTimelineAxis scrollTimelineName scrollbarColor scrollbarGutter scrollbarWidth
shapeImageThreshold shapeMargin shapeOutside shapeRendering speakAs stopColor
stopOpacity stroke strokeColor strokeDasharray strokeDashoffset strokeLinecap
strokeLinejoin strokeMiterlimit strokeOpacity strokeWidth tabSize tableLayout textAlign
textAlignLast textAnchor textAutospace textBox textBoxEdge textBoxTrim
textCombineUpright textDecoration textDecorationColor textDecorationLine
textDecorationSkip textDecorationSkipInk textDecorationStyle textDecorationThickness
textEmphasis textEmphasisColor textEmphasisPosition textEmphasisStyle textIndent
textJustify textOrientation textOverflow textRendering textShadow textSizeAdjust
textSpacingTrim textTransform textUnderlineOffset textUnderlinePosition textWrap
textWrapMode textWrapStyle timelineScope top touchAction transform transformBox
transformOrigin transformStyle transition transitionBehavior transitionDelay
transitionDuration transitionProperty transitionTimingFunction translate unicodeBidi
userSelect vectorEffect verticalAlign viewTimeline viewTimelineAxis viewTimelineInset
viewTimelineName viewTransitionClass viewTransitionName visibility whiteSpace
whiteSpaceCollapse widows width willChange wordBreak wordSpacing wordWrap writingMode x
y zIndex zoom`.split(/\s+/),
);
export const unitlessProperties = new Set(
  `KhtmlBoxFlex KhtmlBoxFlexGroup KhtmlBoxOrdinalGroup KhtmlOpacity MozAnimation
MozAnimationIterationCount MozBorderImage MozBoxFlex MozBoxOrdinalGroup MozColumnCount
MozColumns MozOpacity MozTabSize OAnimation OAnimationIterationCount OBorderImage
OTabSize WebkitAnimation WebkitAnimationIterationCount WebkitBorderImage
WebkitBorderImageSlice WebkitBoxFlex WebkitBoxFlexGroup WebkitBoxOrdinalGroup
WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexShrink
WebkitInitialLetter WebkitLineClamp WebkitMaskBoxImage WebkitMaskBoxImageOutset
WebkitMaskBoxImageSlice WebkitMaskBoxImageWidth WebkitOrder animation
animationIterationCount aspectRatio borderImage borderImageOutset borderImageSlice
borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns fillOpacity
flex flexGrow flexShrink floodOpacity fontSizeAdjust fontWeight glyphOrientationVertical
gridArea gridColumn gridColumnEnd gridColumnStart gridRow gridRowEnd gridRowStart
hyphenateLimitChars initialLetter lineClamp lineHeight maskBorder maskBorderOutset
maskBorderSlice maskBorderWidth mathDepth maxLines msFlex msFlexPositive
msHyphenateLimitChars msHyphenateLimitLines msOrder opacity order orphans scale
shapeImageThreshold stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit
strokeOpacity strokeWidth tabSize widows zIndex zoom`.split(/\s+/),
);
