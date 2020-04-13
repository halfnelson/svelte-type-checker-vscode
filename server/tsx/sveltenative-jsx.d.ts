declare namespace svelteNative.JSX {
 
    /* svelte2tsx JSX */
    interface ElementClass {
      $$prop_def: any;
    }
  
    interface ElementAttributesProperty {
      $$prop_def: any; // specify the property name to use
    }
  
    /* svelte-native jsx types */
    type SvelteNativeNode = {};
  
    export type Child = SvelteNativeNode | SvelteNativeNode[] | string | number;
    export type Children = Child | Child[];
  
    interface IntrinsicAttributes {}

    
/*
  Attributes
*/

type ActionBarAttributes = {
    title: string
    navigationbutton: string
    actionitems: string
    page: string
};

type ActionItemAttributes = {
    text: string
    icon: string
    visibility: string
    actionbar: string
    page: string
};

type ActivityIndicatorAttributes = {
    busy: boolean
};

type BorderAttributes = {
    cornerradius: number
};

type ButtonAttributes = {
    text: string
    textwrap: boolean
    formattedtext: string
};

type ContentViewAttributes = {
};

type BindableAttributes = {
};

type ViewAttributes = {
    borderradius: number
    borderwidth: number
    bordercolor: string
    automationtext: string
    loaded: string
    unloaded: string
    color: string
    backgroundcolor: string
    backgroundimage: string
    minwidth: number
    minheight: number
    width: number
    height: number
    margin: string
    marginleft: number
    margintop: number
    marginright: number
    marginbottom: number
    horizontalalignment: string
    verticalalignment: string
    visibility: string
    opacity: number
    translatex: number
    translatey: number
    scalex: number
    scaley: number
    originx: number
    originy: number
    rotate: number
    isenabled: boolean
    isuserinteractionenabled: boolean
    id: string
    cssclass: string
    classname: string
    style: string
    csstype: string
    row: number
    col: number
    rowspan: number
    colspan: number
    left: number
    top: number
    dock: string
    class: string
    tap: string
    ontap: string
    doubletap: string
    ondoubletap: string
    longpress: string
    onlongpress: string
    pinch: string
    onpinch: string
    pan: string
    onpan: string
    swipe: string
    onswipe: string
    rotation: string
    onrotation: string
};

type CustomLayoutViewAttributes = {
};

type DatePickerAttributes = {
    year: number
    month: number
    day: number
    date: string
    maxdate: string
    mindate: string
};

type EditableTextBaseAttributes = {
    keyboardtype: string
    returnkeytype: string
    editable: boolean
    updatetexttrigger: string
    autocapitalizationtype: string
    autocorrect: boolean
    hint: string
};

type HtmlViewAttributes = {
    html: string
};

type ImageAttributes = {
    isloading: boolean
    stretch: string
    src: string
};

type LabelAttributes = {
    textwrap: boolean
};

type AbsoluteLayoutAttributes = {
};

type DockLayoutAttributes = {
    stretchlastchild: boolean
};

type GridLayoutAttributes = {
    rows: string
    columns: string
};

type LayoutBaseAttributes = {
    padding: string
    paddingbottom: number
    paddingleft: number
    paddingright: number
    paddingtop: number
};

type StackLayoutAttributes = {
    orientation: string
};

type WrapLayoutAttributes = {
    orientation: string
    itemwidth: number
    itemheight: number
};

type ListPickerAttributes = {
    selectedindex: number
};

type ListViewAttributes = {
    itemloading: string
    itemtap: string
    loadmoreitems: string
    isscrolling: boolean
    itemtemplate: string
    separatorcolor: string
    rowheight: number
    items: string
};

type PageAttributes = {
    showingmodally: string
    shownmodally: string
    navigatingto: string
    navigatedto: string
    navigatingfrom: string
    navigatedfrom: string
    backgroundspanunderstatusbar: boolean
    actionbarhidden: boolean
    css: string
    actionbar: string
    modal: string
};

type PlaceholderAttributes = {
    creatingview: string
};

type ProgressAttributes = {
    value: number
    maxvalue: number
};

type ProxyViewContainerAttributes = {
};

type RepeaterAttributes = {
    itemtemplate: string
    itemslayout: string
    items: string
};

type ScrollViewAttributes = {
    scroll: string
    verticaloffset: number
    horizontaloffset: number
    scrollableheight: number
    scrollablewidth: number
    orientation: string
};

type SearchBarAttributes = {
    submit: string
    clear: string
    text: string
    hint: string
    textfieldbackgroundcolor: string
    textfieldhintcolor: string
};

type SegmentedBarAttributes = {
    selectedindex: number
    selectedbackgroundcolor: string
    items: string
    selectedindexchanged: string
};

type SliderAttributes = {
    value: number
    minvalue: number
    maxvalue: number
};

type SwitchAttributes = {
    checked: boolean
};

type TabViewAttributes = {
    items: string
    selectedindex: number
    selectedcolor: string
    tabsbackgroundcolor: string
    selectedindexchanged: string
};

type TextBaseAttributes = {
    text: string
    textalignment: string
    fontsize: number
    formattedtext: string
};

type TextFieldAttributes = {
    returnpress: string
    secure: boolean
};

type TextViewAttributes = {
};

type TimePickerAttributes = {
    hour: number
    minute: number
    time: string
    maxhour: number
    maxminute: number
    minhour: number
    minminute: number
    minuteinterval: number
};

type WebViewAttributes = {
    loadstarted: string
    loadfinished: string
    navigationtypes: string
    url: string
    src: string
    cangoback: boolean
    cangoforward: boolean
};


/*
  Element Types 
*/

type ActionBar = View & ActionBarAttributes;

type ActionItem = Bindable & ActionItemAttributes;

type ActivityIndicator = View & ActivityIndicatorAttributes;

type Border = ContentView & BorderAttributes;

type Button = View & ButtonAttributes;

type ContentView = View & ContentViewAttributes;

type Bindable = BindableAttributes;

type View = ViewAttributes;

type CustomLayoutView = View & CustomLayoutViewAttributes;

type DatePicker = View & DatePickerAttributes;

type EditableTextBase = TextBase & EditableTextBaseAttributes;

type HtmlView = View & HtmlViewAttributes;

type Image = View & ImageAttributes;

type Label = TextBase & LabelAttributes;

type AbsoluteLayout = LayoutBase & AbsoluteLayoutAttributes;

type DockLayout = LayoutBase & DockLayoutAttributes;

type GridLayout = LayoutBase & GridLayoutAttributes;

type LayoutBase = CustomLayoutView & LayoutBaseAttributes;

type StackLayout = LayoutBase & StackLayoutAttributes;

type WrapLayout = LayoutBase & WrapLayoutAttributes;

type ListPicker = View & ListPickerAttributes;

type ListView = View & ListViewAttributes;

type Page = View & PageAttributes;

type Placeholder = View & PlaceholderAttributes;

type Progress = View & ProgressAttributes;

type ProxyViewContainer = LayoutBase & ProxyViewContainerAttributes;

type Repeater = View & RepeaterAttributes;

type ScrollView = ContentView & ScrollViewAttributes;

type SearchBar = View & SearchBarAttributes;

type SegmentedBar = View & SegmentedBarAttributes;

type Slider = View & SliderAttributes;

type Switch = View & SwitchAttributes;

type TabView = View & TabViewAttributes;

type TextBase = View & TextBaseAttributes;

type TextField = EditableTextBase & TextFieldAttributes;

type TextView = EditableTextBase & TextViewAttributes;

type TimePicker = View & TimePickerAttributes;

type WebView = View & WebViewAttributes;


interface IntrinsicElements {
    actionBar: ActionBar;
    actionItem: ActionItem;
    activityIndicator: ActivityIndicator;
    border: Border;
    button: Button;
    contentView: ContentView;
    bindable: Bindable;
    view: View;
    customLayoutView: CustomLayoutView;
    datePicker: DatePicker;
    editableTextBase: EditableTextBase;
    htmlView: HtmlView;
    image: Image;
    label: Label;
    absoluteLayout: AbsoluteLayout;
    dockLayout: DockLayout;
    gridLayout: GridLayout;
    layoutBase: LayoutBase;
    stackLayout: StackLayout;
    wrapLayout: WrapLayout;
    listPicker: ListPicker;
    listView: ListView;
    page: Page;
    placeholder: Placeholder;
    progress: Progress;
    proxyViewContainer: ProxyViewContainer;
    repeater: Repeater;
    scrollView: ScrollView;
    searchBar: SearchBar;
    segmentedBar: SegmentedBar;
    slider: Slider;
    switch: Switch;
    tabView: TabView;
    textBase: TextBase;
    textField: TextField;
    textView: TextView;
    timePicker: TimePicker;
    webView: WebView;
    [name: string]: { [name: string]: any };
}
    
}
