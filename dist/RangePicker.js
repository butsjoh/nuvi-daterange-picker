"use strict";
var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var React = _interopRequire(require("react/addons"));

var moment = _interopRequire(require("moment"));

var Immutable = _interopRequire(require("immutable"));

var Month = _interopRequire(require("./Month"));

var SingleDate = _interopRequire(require("./SingleDate"));

var RangeDate = _interopRequire(require("./RangeDate"));

var PureRenderMixin = React.addons.PureRenderMixin;


function noop() {}


var RangePicker = React.createClass({
  displayName: "RangePicker",
  mixins: [PureRenderMixin],

  propTypes: {
    numberOfCalendars: React.PropTypes.number,
    firstOfWeek: React.PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
    disableNavigation: React.PropTypes.bool,
    initialDate: React.PropTypes.instanceOf(Date),
    initialRange: React.PropTypes.object,
    initialMonth: React.PropTypes.number, // Overrides values derived from initialDate/initialRange
    initialYear: React.PropTypes.number, // Overrides values derived from initialDate/initialRange
    earliestDate: React.PropTypes.instanceOf(Date),
    latestDate: React.PropTypes.instanceOf(Date),
    selectionType: React.PropTypes.oneOf(["single", "range"]),
    stateDefinitions: React.PropTypes.object,
    dateStates: React.PropTypes.array, // an array of date ranges and their states
    defaultState: React.PropTypes.string,
    value: React.PropTypes.object, // range or single value
    initialFromValue: React.PropTypes.bool,
    showLegend: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function getDefaultProps() {
    var date = new Date();
    var initialDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return {
      numberOfCalendars: 1,
      firstOfWeek: 0,
      disableNavigation: false,
      nextLabel: "",
      previousLabel: "",
      initialDate: initialDate,
      initialFromValue: true,
      selectionType: "range",
      stateDefinitions: {
        __default: {
          color: null,
          selectable: true,
          label: null
        }
      },
      defaultState: "__default",
      dateStates: [],
      showLegend: false,
      onSelect: noop
    };
  },

  getInitialState: function getInitialState() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();

    if (this.props.initialYear && this.props.initialMonth) {
      year = this.props.initialYear;
      month = this.props.initialMonth;
    }

    if (this.props.initialFromValue && this.props.value) {
      if (this.props.selectionType === "single") {
        year = this.props.value.toDate().getFullYear();
        month = this.props.value.toDate().getMonth();
      } else {
        year = this.props.value.start.toDate().getFullYear();
        month = this.props.value.start.toDate().getMonth();
      }
    }

    return {
      year: year,
      month: month,
      selectedStartDate: null,
      highlightStartDate: null,
      highlightedDate: null,
      highlightRange: null
    };
  },

  getDateStates: function getDateStates() {
    var dateStates = this.props.dateStates;
    var actualStates = [];
    var minDate = new Date(-8640000000000000 / 2);
    var maxDate = new Date(8640000000000000 / 2);
    var dateCursor = moment(minDate);

    dateStates.forEach((function (s) {
      var r = s.range;
      if (!dateCursor.isSame(r.start)) {
        actualStates.push({
          state: this.props.defaultState,
          range: moment().range(dateCursor, r.start)
        });
      }

      actualStates.push(s);
      dateCursor = r.end;
    }).bind(this));

    actualStates.push({
      state: this.props.defaultState,
      range: moment().range(dateCursor, moment(maxDate))
    });
    return actualStates;
  },

  onSelect: function onSelect(date) {
    this.props.onSelect(moment(date));
  },

  onStartSelection: function onStartSelection(date) {
    this.setState({
      selectedStartDate: date
    });
  },

  onCompleteSelection: function onCompleteSelection(range, states) {
    this.setState({
      selectedStartDate: null,
      highlightedRange: null,
      highlightedDate: null
    });
    this.props.onSelect(range, states);
  },

  onHighlightDate: function onHighlightDate(date) {
    this.setState({
      highlightedDate: date });
  },

  onHighlightRange: function onHighlightRange(range) {
    this.setState({
      highlightedRange: range,
      highlightedDate: null
    });
  },

  onUnHighlightDate: function onUnHighlightDate(date) {
    this.setState({
      highlightedDate: null
    });
  },

  getMonthDate: function getMonthDate() {
    return new Date(this.state.year, this.state.month, 1);
  },

  moveForward: function moveForward() {
    var monthDate = this.getMonthDate();
    monthDate.setMonth(monthDate.getMonth() + 1);
    this.setState({
      year: monthDate.getFullYear(),
      month: monthDate.getMonth()
    });
  },

  moveBack: function moveBack() {
    var monthDate = this.getMonthDate();
    monthDate.setMonth(monthDate.getMonth() - 1);
    this.setState({
      year: monthDate.getFullYear(),
      month: monthDate.getMonth()
    });
  },

  changeYear: function changeYear(year) {
    var month = this.state.month;

    if (this.props.earliestDate && new Date(year, month, 1).getTime() < this.props.earliestDate.getTime()) {
      month = this.props.earliestDate.getMonth();
    }

    if (this.props.latestDate && new Date(year, month + 1, 1).getTime() > this.props.latestDate.getTime()) {
      month = this.props.latestDate.getMonth();
    }

    this.setState({
      year: year,
      month: month
    });
  },

  changeMonth: function changeMonth(date) {
    this.setState({
      month: date
    });
  },

  renderCalendar: function renderCalendar(index) {
    var monthDate = this.getMonthDate();
    var year = monthDate.getFullYear();
    var month = monthDate.getMonth();
    var key = index + "-" + year + "-" + month;
    var props;
    var dateStates;

    monthDate = new Date(year, month + index, 1);

    // sanitize date states
    dateStates = Immutable.List(this.getDateStates()).map((function (s) {
      var range = moment().range(s.range.start.startOf("day"), s.range.end.startOf("day"));

      var def = this.props.stateDefinitions[s.state];

      return Immutable.Map({
        range: range,
        state: s.state,
        selectable: def.selectable,
        color: def.color
      });
    }).bind(this));

    props = {
      index: index,
      maxIndex: this.props.numberOfCalendars - 1,
      minDate: this.props.earliestDate,
      maxDate: this.props.latestDate,
      firstOfMonth: monthDate,
      firstOfWeek: this.props.firstOfWeek,
      onMonthChange: this.changeMonth,
      onYearChange: this.changeYear,
      key: key,
      value: this.props.value,
      highlightStartDate: this.state.highlightStartDate,
      selectionType: this.props.selectionType,
      selectedStartDate: this.state.selectedStartDate,
      highlightedDate: this.state.highlightedDate,
      highlightedRange: this.state.highlightedRange,
      onHighlightRange: this.onHighlightRange,
      onHighlightDate: this.onHighlightDate,
      onUnHighlightDate: this.onUnHighlightDate,
      onSelect: this.onSelect,
      onStartSelection: this.onStartSelection,
      onCompleteSelection: this.onCompleteSelection,
      dateComponent: this.props.selectionType == "range" ? RangeDate : SingleDate,
      dateStates: dateStates
    };

    return React.createElement(Month, props);
  },

  render: function () {
    var calendars = Immutable.Range(0, this.props.numberOfCalendars).map(this.renderCalendar);

    return React.createElement(
      "div",
      { className: "reactDaterangePicker" },
      React.createElement(
        "div",
        { className: "reactDaterangePicker__pagination reactDaterangePicker__pagination--previous", onClick: this.moveBack },
        React.createElement("div", { className: "reactDaterangePicker__arrow reactDaterangePicker__arrow--previous" })
      ),
      calendars.toJS(),
      React.createElement(
        "div",
        { className: "reactDaterangePicker__pagination reactDaterangePicker__pagination--next", onClick: this.moveForward },
        React.createElement("div", { className: "reactDaterangePicker__arrow reactDaterangePicker__arrow--next" })
      ),
      this.props.showLegend ? React.createElement(
        "p",
        null,
        "Legendary"
      ) : null
    );
  }
});

module.exports = RangePicker;