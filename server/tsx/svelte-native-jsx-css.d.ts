  /* Nativescript CSS Defs */

  type ClassNameBase = boolean | string | number | void | null;
  type ClassName =
    | string
    | (ClassNameBase | ClassNameBase[])[]
    | {
        [key: string]: boolean;
      };

  // See CSS 3 CSS-wide keywords https://www.w3.org/TR/css3-values/#common-keywords
  // See CSS 3 Explicit Defaulting https://www.w3.org/TR/css-cascade-3/#defaulting-keywords
  // "all CSS properties can accept these values"
  type CSSWideKeyword = "initial" | "inherit" | "unset";

  // See CSS 3 <percentage> type https://drafts.csswg.org/css-values-3/#percentages
  type CSSPercentage = string;

  // See CSS 3 <length> type https://drafts.csswg.org/css-values-3/#lengths
  type CSSLength = number | string;

  // This interface is not complete. Only properties accepting
  // unit-less numbers are listed here (see CSSProperty.js in React)
  interface CSSProperties {
    alignContent?:
      | CSSWideKeyword
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "stretch";

    alignItems?:
      | CSSWideKeyword
      | "flex-start"
      | "flex-end"
      | "center"
      | "baseline"
      | "stretch";

    alignSelf?:
      | CSSWideKeyword
      | "auto"
      | "flex-start"
      | "flex-end"
      | "center"
      | "baseline"
      | "stretch";

    alignmentAdjust?: CSSWideKeyword | any;

    alignmentBaseline?: CSSWideKeyword | any;

    animationDelay?: CSSWideKeyword | any;

    animationDirection?: CSSWideKeyword | any;

    animationIterationCount?: CSSWideKeyword | any;

    animationName?: CSSWideKeyword | any;

    animationPlayState?: CSSWideKeyword | any;

    appearance?: CSSWideKeyword | any;

    backfaceVisibility?: CSSWideKeyword | any;

    background?: CSSWideKeyword | any;

    backgroundAttachment?: CSSWideKeyword | "scroll" | "fixed" | "local";

    backgroundBlendMode?: CSSWideKeyword | any;

    backgroundColor?: CSSWideKeyword | any;

    backgroundComposite?: CSSWideKeyword | any;

    backgroundImage?: CSSWideKeyword | any;

    backgroundOrigin?: CSSWideKeyword | any;

    backgroundPosition?: CSSWideKeyword | any;

    backgroundRepeat?: CSSWideKeyword | any;

    baselineShift?: CSSWideKeyword | any;

    behavior?: CSSWideKeyword | any;

    border?: CSSWideKeyword | any;

    borderBottom?: CSSWideKeyword | any;

    borderBottomColor?: CSSWideKeyword | any;

    borderBottomLeftRadius?: CSSWideKeyword | any;

    borderBottomRightRadius?: CSSWideKeyword | any;

    borderBottomStyle?: CSSWideKeyword | any;

    borderBottomWidth?: CSSWideKeyword | any;

    borderCollapse?: CSSWideKeyword | any;

    borderColor?: CSSWideKeyword | any;

    borderCornerShape?: CSSWideKeyword | any;

    borderImageSource?: CSSWideKeyword | any;

    borderImageWidth?: CSSWideKeyword | any;

    borderLeft?: CSSWideKeyword | any;

    borderLeftColor?: CSSWideKeyword | any;

    borderLeftStyle?: CSSWideKeyword | any;

    borderLeftWidth?: CSSWideKeyword | any;

    borderRight?: CSSWideKeyword | any;

    borderRightColor?: CSSWideKeyword | any;

    borderRightStyle?: CSSWideKeyword | any;

    borderRightWidth?: CSSWideKeyword | any;

    borderSpacing?: CSSWideKeyword | any;

    borderStyle?: CSSWideKeyword | any;

    borderTop?: CSSWideKeyword | any;

    borderTopColor?: CSSWideKeyword | any;

    borderTopLeftRadius?: CSSWideKeyword | any;

    borderTopRightRadius?: CSSWideKeyword | any;

    borderTopStyle?: CSSWideKeyword | any;

    borderTopWidth?: CSSWideKeyword | any;

    borderWidth?: CSSWideKeyword | any;

    bottom?: CSSWideKeyword | any;

    boxDecorationBreak?: CSSWideKeyword | any;

    boxShadow?: CSSWideKeyword | any;

    breakAfter?: CSSWideKeyword | any;

    breakBefore?: CSSWideKeyword | any;

    breakInside?: CSSWideKeyword | any;

    clear?: CSSWideKeyword | any;

    clip?: CSSWideKeyword | any;

    clipRule?: CSSWideKeyword | any;

    color?: CSSWideKeyword | any;

    columnCount?: CSSWideKeyword | number | "auto";

    columnFill?: CSSWideKeyword | any;

    columnGap?: CSSWideKeyword | any;

    columnRule?: CSSWideKeyword | any;

    columnRuleColor?: CSSWideKeyword | any;

    columnRuleWidth?: CSSWideKeyword | any;

    columnSpan?: CSSWideKeyword | any;

    columnWidth?: CSSWideKeyword | any;

    columns?: CSSWideKeyword | any;

    counterIncrement?: CSSWideKeyword | any;

    counterReset?: CSSWideKeyword | any;

    cue?: CSSWideKeyword | any;

    cueAfter?: CSSWideKeyword | any;

    cursor?: CSSWideKeyword | any;

    direction?: CSSWideKeyword | any;

    display?: CSSWideKeyword | any;

    fill?: CSSWideKeyword | any;

    fillOpacity?: CSSWideKeyword | number;

    fillRule?: CSSWideKeyword | any;

    filter?: CSSWideKeyword | any;

    flex?: CSSWideKeyword | number | string;

    flexAlign?: CSSWideKeyword | any;

    flexBasis?: CSSWideKeyword | any;

    flexDirection?:
      | CSSWideKeyword
      | "row"
      | "row-reverse"
      | "column"
      | "column-reverse";

    flexFlow?: CSSWideKeyword | string;

    flexGrow?: CSSWideKeyword | number;

    flexOrder?: CSSWideKeyword | any;

    flexShrink?: CSSWideKeyword | number;

    flexWrap?: CSSWideKeyword | "nowrap" | "wrap" | "wrap-reverse";

    float?: CSSWideKeyword | any;

    flowFrom?: CSSWideKeyword | any;

    font?: CSSWideKeyword | any;

    fontFamily?: CSSWideKeyword | any;

    fontKerning?: CSSWideKeyword | any;

    fontSize?:
      | CSSWideKeyword
      | "xx-small"
      | "x-small"
      | "small"
      | "medium"
      | "large"
      | "x-large"
      | "xx-large"
      | "larger"
      | "smaller"
      | CSSLength
      | CSSPercentage;

    fontSizeAdjust?: CSSWideKeyword | "none" | number;

    fontStretch?:
      | CSSWideKeyword
      | "normal"
      | "ultra-condensed"
      | "extra-condensed"
      | "condensed"
      | "semi-condensed"
      | "semi-expanded"
      | "expanded"
      | "extra-expanded"
      | "ultra-expanded";

    fontStyle?: CSSWideKeyword | "normal" | "italic" | "oblique";

    fontSynthesis?: CSSWideKeyword | any;

    fontVariant?: CSSWideKeyword | any;

    fontVariantAlternates?: CSSWideKeyword | any;

    fontWeight?:
      | CSSWideKeyword
      | "normal"
      | "bold"
      | "bolder"
      | "lighter"
      | 100
      | 200
      | 300
      | 400
      | 500
      | 600
      | 700
      | 800
      | 900;

    gridArea?: CSSWideKeyword | any;

    gridColumn?: CSSWideKeyword | any;

    gridColumnEnd?: CSSWideKeyword | any;

    gridColumnStart?: CSSWideKeyword | any;

    gridRow?: CSSWideKeyword | any;

    gridRowEnd?: CSSWideKeyword | any;

    gridRowPosition?: CSSWideKeyword | any;

    gridRowSpan?: CSSWideKeyword | any;

    gridTemplateAreas?: CSSWideKeyword | any;

    gridTemplateColumns?: CSSWideKeyword | any;

    gridTemplateRows?: CSSWideKeyword | any;

    height?: CSSWideKeyword | any;

    hyphenateLimitChars?: CSSWideKeyword | any;

    hyphenateLimitLines?: CSSWideKeyword | any;

    hyphenateLimitZone?: CSSWideKeyword | any;

    hyphens?: CSSWideKeyword | any;

    imeMode?: CSSWideKeyword | any;

    justifyContent?:
      | CSSWideKeyword
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "space-evenly";

    layoutGrid?: CSSWideKeyword | any;

    layoutGridChar?: CSSWideKeyword | any;

    layoutGridLine?: CSSWideKeyword | any;

    layoutGridMode?: CSSWideKeyword | any;

    layoutGridType?: CSSWideKeyword | any;

    left?: CSSWideKeyword | any;

    letterSpacing?: CSSWideKeyword | any;

    lineBreak?: CSSWideKeyword | any;

    lineClamp?: CSSWideKeyword | number;

    lineHeight?: CSSWideKeyword | "normal" | number | CSSLength | CSSPercentage;

    listStyle?: CSSWideKeyword | any;

    listStyleImage?: CSSWideKeyword | any;

    listStylePosition?: CSSWideKeyword | any;

    listStyleType?: CSSWideKeyword | any;

    margin?: CSSWideKeyword | any;

    marginBottom?: CSSWideKeyword | any;

    marginLeft?: CSSWideKeyword | any;

    marginRight?: CSSWideKeyword | any;

    marginTop?: CSSWideKeyword | any;

    marqueeDirection?: CSSWideKeyword | any;

    marqueeStyle?: CSSWideKeyword | any;

    mask?: CSSWideKeyword | any;

    maskBorder?: CSSWideKeyword | any;

    maskBorderRepeat?: CSSWideKeyword | any;

    maskBorderSlice?: CSSWideKeyword | any;

    maskBorderSource?: CSSWideKeyword | any;

    maskBorderWidth?: CSSWideKeyword | any;

    maskClip?: CSSWideKeyword | any;

    maskOrigin?: CSSWideKeyword | any;

    maxFontSize?: CSSWideKeyword | any;

    maxHeight?: CSSWideKeyword | any;

    maxWidth?: CSSWideKeyword | any;

    minHeight?: CSSWideKeyword | any;

    minWidth?: CSSWideKeyword | any;

    opacity?: CSSWideKeyword | number;

    order?: CSSWideKeyword | number;

    orphans?: CSSWideKeyword | number;

    outline?: CSSWideKeyword | any;

    outlineColor?: CSSWideKeyword | any;

    outlineOffset?: CSSWideKeyword | any;

    overflow?: CSSWideKeyword | "auto" | "hidden" | "scroll" | "visible";

    overflowStyle?: CSSWideKeyword | any;

    overflowX?: CSSWideKeyword | "auto" | "hidden" | "scroll" | "visible";

    overflowY?: CSSWideKeyword | "auto" | "hidden" | "scroll" | "visible";

    padding?: CSSWideKeyword | any;

    paddingBottom?: CSSWideKeyword | any;

    paddingLeft?: CSSWideKeyword | any;

    paddingRight?: CSSWideKeyword | any;

    paddingTop?: CSSWideKeyword | any;

    pageBreakAfter?: CSSWideKeyword | any;

    pageBreakBefore?: CSSWideKeyword | any;

    pageBreakInside?: CSSWideKeyword | any;

    pause?: CSSWideKeyword | any;

    pauseAfter?: CSSWideKeyword | any;

    pauseBefore?: CSSWideKeyword | any;

    perspective?: CSSWideKeyword | any;

    perspectiveOrigin?: CSSWideKeyword | any;

    pointerEvents?: CSSWideKeyword | any;

    position?:
      | CSSWideKeyword
      | "static"
      | "relative"
      | "absolute"
      | "fixed"
      | "sticky";

    punctuationTrim?: CSSWideKeyword | any;

    quotes?: CSSWideKeyword | any;

    regionFragment?: CSSWideKeyword | any;

    restAfter?: CSSWideKeyword | any;

    restBefore?: CSSWideKeyword | any;

    right?: CSSWideKeyword | any;

    rubyAlign?: CSSWideKeyword | any;

    rubyPosition?: CSSWideKeyword | any;

    shapeImageThreshold?: CSSWideKeyword | any;

    shapeInside?: CSSWideKeyword | any;

    shapeMargin?: CSSWideKeyword | any;

    shapeOutside?: CSSWideKeyword | any;

    speak?: CSSWideKeyword | any;

    speakAs?: CSSWideKeyword | any;

    strokeOpacity?: CSSWideKeyword | number;

    strokeWidth?: CSSWideKeyword | CSSPercentage | CSSLength;

    tabSize?: CSSWideKeyword | any;

    tableLayout?: CSSWideKeyword | any;

    textAlign?: CSSWideKeyword | any;

    textAlignLast?: CSSWideKeyword | any;

    textDecoration?: CSSWideKeyword | any;

    textDecorationColor?: CSSWideKeyword | any;

    textDecorationLine?: CSSWideKeyword | any;

    textDecorationLineThrough?: CSSWideKeyword | any;

    textDecorationNone?: CSSWideKeyword | any;

    textDecorationOverline?: CSSWideKeyword | any;

    textDecorationSkip?: CSSWideKeyword | any;

    textDecorationStyle?: CSSWideKeyword | any;

    textDecorationUnderline?: CSSWideKeyword | any;

    textEmphasis?: CSSWideKeyword | any;

    textEmphasisColor?: CSSWideKeyword | any;

    textEmphasisStyle?: CSSWideKeyword | any;

    textHeight?: CSSWideKeyword | any;

    textIndent?: CSSWideKeyword | any;

    textJustifyTrim?: CSSWideKeyword | any;

    textKashidaSpace?: CSSWideKeyword | any;

    textLineThrough?: CSSWideKeyword | any;

    textLineThroughColor?: CSSWideKeyword | any;

    textLineThroughMode?: CSSWideKeyword | any;

    textLineThroughStyle?: CSSWideKeyword | any;

    textLineThroughWidth?: CSSWideKeyword | any;

    textOverflow?: CSSWideKeyword | any;

    textOverline?: CSSWideKeyword | any;

    textOverlineColor?: CSSWideKeyword | any;

    textOverlineMode?: CSSWideKeyword | any;

    textOverlineStyle?: CSSWideKeyword | any;

    textOverlineWidth?: CSSWideKeyword | any;

    textRendering?: CSSWideKeyword | any;

    textShadow?: CSSWideKeyword | any;

    textTransform?: CSSWideKeyword | any;

    textUnderlinePosition?: CSSWideKeyword | any;

    textUnderlineStyle?: CSSWideKeyword | any;

    top?: CSSWideKeyword | any;

    touchAction?: CSSWideKeyword | any;

    transform?: CSSWideKeyword | any;

    transformOrigin?: CSSWideKeyword | any;

    transformOriginZ?: CSSWideKeyword | any;

    transformStyle?: CSSWideKeyword | any;

    transition?: CSSWideKeyword | any;

    transitionDelay?: CSSWideKeyword | any;

    transitionDuration?: CSSWideKeyword | any;

    transitionProperty?: CSSWideKeyword | any;

    transitionTimingFunction?: CSSWideKeyword | any;

    unicodeBidi?: CSSWideKeyword | any;

    unicodeRange?: CSSWideKeyword | any;

    userFocus?: CSSWideKeyword | any;

    userInput?: CSSWideKeyword | any;

    verticalAlign?: CSSWideKeyword | any;

    visibility?: CSSWideKeyword | any;

    voiceBalance?: CSSWideKeyword | any;

    voiceDuration?: CSSWideKeyword | any;

    voiceFamily?: CSSWideKeyword | any;

    voicePitch?: CSSWideKeyword | any;

    voiceRange?: CSSWideKeyword | any;

    voiceRate?: CSSWideKeyword | any;

    voiceStress?: CSSWideKeyword | any;

    voiceVolume?: CSSWideKeyword | any;

    whiteSpace?: CSSWideKeyword | any;

    whiteSpaceTreatment?: CSSWideKeyword | any;

    widows?: CSSWideKeyword | number;

    width?: CSSWideKeyword | any;

    wordBreak?: CSSWideKeyword | any;

    wordSpacing?: CSSWideKeyword | any;

    wordWrap?: CSSWideKeyword | any;

    wrapFlow?: CSSWideKeyword | any;

    wrapMargin?: CSSWideKeyword | any;

    wrapOption?: CSSWideKeyword | any;

    writingMode?: CSSWideKeyword | any;

    zIndex?: CSSWideKeyword | "auto" | number;

    zoom?: CSSWideKeyword | "auto" | number | CSSPercentage;

    [propertyName: string]: any;
  }