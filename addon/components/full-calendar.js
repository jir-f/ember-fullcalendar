/* global FullCalendar */

import Ember from 'ember';
import layout from '../templates/components/full-calendar';
import { InvokeActionMixin } from 'ember-invoke-action';

const { assign, observer, computed, getOwner } = Ember;

export default Ember.Component.extend(InvokeActionMixin, {

  /////////////////////////////////////
  // PROPERTIES
  /////////////////////////////////////

  layout: layout,
  classNames: ['full-calendar'],
  calendar: undefined,

  /////////////////////////////////////
  // FULLCALENDAR OPTIONS
  /////////////////////////////////////

  // scheduler defaults to non-commercial license
  schedulerLicenseKey: computed(function() {

    // load the consuming app's config
    const applicationConfig = getOwner(this).resolveRegistration('config:environment');
    const defaultSchedulerLicenseKey = 'CC-Attribution-NonCommercial-NoDerivatives';

    if (applicationConfig &&
        applicationConfig.emberFullCalendar &&
        applicationConfig.emberFullCalendar.schedulerLicenseKey) {
      return applicationConfig.emberFullCalendar.schedulerLicenseKey;
    }

    return defaultSchedulerLicenseKey;
  }),

  fullCalendarOptions: [
    // general display
    'header', 'footer', 'customButtons', 'buttonIcons', 'themeSystem', 'theme', 'themeButtonIcons', 'bootstrapGlyphicons',
    'firstDay', 'rerenderDelay', 'weekends', 'hiddenDays', 'fixedWeekCount', 'weekNumbers', 'weekNumberCalculation', 'businessHours',
    'height', 'contentHeight', 'aspectRatio', 'handleWindowResize', 'eventLimit', 'weekNumbersWithinDays', 'showNonCurrentDates',

    // clicking & hovering
    'navLinks',

    // timezone
    'timeZone', 'now',

    // views
    'views',

    // agenda options
    'allDaySlot', 'allDayText', 'slotDuration', 'slotLabelFormat', 'slotLabelInterval', 'snapDuration', 'scrollTime',
    'minTime', 'maxTime', 'slotEventOverlap', 'agendaEventMinHeight',

    // list options
    'listDayFormat', 'listDayAltFormat', 'noEventsMessage',

    // current date
    'nowIndicator', 'visibleRange', 'validRange', 'dateIncrement', 'dateAlignment', 'duration', 'dayCount',

    // text/time customization
    'locale', 'columnFormat', 'titleFormat', 'buttonText', 'defaultRangeSeparator', 'titleRangeSeparator',
    'weekNumberTitle', 'displayEventTime', 'displayEventEnd', 'eventLimitText', 'dayPopoverFormat',

    // selection
    'selectable', 'selectMirror', 'unselectAuto', 'unselectCancel', 'selectOverlap', 'selectConstraint', 'selectAllow',
    'selectMinDistance', 'selectLongPressDelay',

    // event data
    'events', 'eventSources', 'allDayDefault', 'startParam', 'endParam', 'timezoneParam', 'lazyFetching',
    'defaultTimedEventDuration', 'defaultAllDayEventDuration', 'forceEventDuration',

    // event rendering
    'eventColor', 'eventBackgroundColor', 'eventBorderColor', 'eventTextColor', 'nextDayThreshold', 'eventOrder',
    'progressiveEventRendering',

    // event dragging & resizing
    'editable', 'eventStartEditable', 'eventDurationEditable', 'dragRevertDuration', 'dragScroll', 'allDayMaintainDuration',
    'eventOverlap', 'eventConstraint', 'eventAllow', 'longPressDelay', 'eventLongPressDelay', 'eventResizableFromStart',
    'eventDragMinDistance',

    // dropping external elements
    'droppable', 'dropAccept',

    // timeline view
    'resourceAreaWidth', 'resourceLabelText', 'resourceColumns', 'slotWidth',

    // resource data
    'resources', 'refetchResourcesOnNavigate',

    // resource rendering
    'resourceOrder', 'resourceGroupField', 'resourceGroupText', 'resourcesInitiallyExpanded', 'filterResourcesWithEvents',

    // vertical resource view
    'groupByResource', 'groupByDateAndResource'
  ],

  fullCalendarEvents: [
    // general display
    'viewSkeletonRender', 'viewSkeletonDestroy', 'dayRender', 'windowResize',

    // clicking and hovering
    'dateClick', 'eventClick', 'eventMouseEnter', 'eventMouseLeave', 'navLinkDayClick', 'navLinkWeekClick',

    // selection
    'select', 'unselect',

    // event data
    'eventDataTransform', 'loading',

    // event rendering
    'eventRender', 'eventDestroy',
    'eventLimitClick',

    // event dragging & resizing
    'eventDragStart', 'eventDragStop', 'eventDrop', 'eventResizeStart', 'eventResizeStop', 'eventResize',

    // dropping external events
    'drop', 'eventReceive',

    // resource rendering
    'resourceText', 'resourceRender',
  ],

  /////////////////////////////////////
  // SETUP/TEARDOWN
  /////////////////////////////////////

  didInsertElement() {

    const options =
      assign(
        this.get('options'),
        this.get('hooks')
      );

    // Temporary patch for `eventDataTransform` method throwing error
    options.eventDataTransform = this.get('eventDataTransform');

    // add the license key for the scheduler
    options.schedulerLicenseKey = this.get('schedulerLicenseKey');

    const calendar = new FullCalendar.Calendar(this.element, options);
    this.set('calendar', calendar);
    this.get('initCalendar')(calendar);
    calendar.render();
  },
  initCalendar() {},

  willDestroyElement() {
    this.get('calendar').destroy();
  },

  /////////////////////////////////////
  // COMPUTED PROPERTIES
  /////////////////////////////////////

  /**
   * Returns all of the valid Fullcalendar options that
   * were passed into the component.
   */
  options: computed(function() {

    const fullCalendarOptions = this.get('fullCalendarOptions');
    const options = {};

    // Apply FullCalendar options based on property name
    fullCalendarOptions.forEach(optionName => {
      if (this.get(optionName) !== undefined) {
        options[optionName] = this.get(optionName);
      }
    });

    // Handle overriden properties
    if (this.get('viewName') !== undefined) {
      options['defaultView'] = this.get('viewName');
    }

    if (this.get('date') !== undefined) {
      options['defaultDate'] = this.get('date');
    }

    return options;
  }),

  /**
   * Returns all of the valid Fullcalendar callback event
   * names that were passed into the component.
   */
  usedEvents: computed('fullCalendarEvents', function() {
    return this.get('fullCalendarEvents').filter(eventName => {
      const methodName = `_${eventName}`;
      return this.get(methodName) !== undefined || this.get(eventName) !== undefined;
    });
  }),

  /**
   * Returns an object that contains a function for each action passed
   * into the component. This object is passed into Fullcalendar.
   */
  hooks: computed(function() {
    const actions = {};

    this.get('usedEvents').forEach((eventName) => {

      // create an event handler that runs the function inside an event loop.
      actions[eventName] = (...args) => {
        Ember.run.schedule('actions', this, () => {
          this.invokeAction(eventName, ...args, this.get('calendar'));
        });
      };
    });

    return actions;
  }),


  /////////////////////////////////////
  // OBSERVERS
  /////////////////////////////////////

  /**
   * Observe the events array for any changes and
   * re-render if changes are detected
   */
  observeEvents: observer('events.[]', function () {
    const events = this.get('events');

    this.get('calendar').batchRendering(() => {
      this.get('calendar').getEvents().forEach(e => e.remove());

      if (events) {
        this.get('calendar').addEventSource(this.get('events'));
      }
    });
  }),

  /**
   * Observe the eventSources array for any changes and
   * re-render if changes are detected
   */
  observeEventSources: observer('eventSources.[]', function () {
     this.get('calendar').batchRendering(() => {
       this.get('calendar').getEventSources().forEach(e => e.remove());

       this.get('eventSources').forEach(function(source){
         if (source) {
           this.get('calendar').addEventSource(source);
         }
       });
     });
  }),

  /**
   * Observes the resources array and refreshes the resource view
   * if any changes are detected
   * @type {[type]}
   */
  observeResources: observer('resources.[]', function() {
    this.get('calendar').refetchResources();
  }),

  /**
   * Observes the 'viewName' property allowing FullCalendar view to be
   * changed from outside of the component.
   */
  viewNameDidChange: Ember.observer('viewName', function() {
    const viewName = this.get('viewName');
    const viewRange = this.get('viewRange');

    this.get('calendar').changeView(viewName, viewRange);

    // Call action if it exists
    if (this.get('onViewChange')) {
      this.get('onViewChange')(viewName, viewRange);
    }
  }),

  /**
   * Observes `date` property allowing date to be changed from outside
   * of the component.
   */
  dateDidChange: Ember.observer('date', function() {
    let date = this.get('date');
    this.get('calendar').gotoDate(date);
  })

});
