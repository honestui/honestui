import type { ComponentType } from "react";
import { AnimatedIndex } from "./animated-index";
import { ChartIndex } from "./chart-index";
import { ShaderIndex } from "./shader-index";

import accordion_controlled from "./default/examples/accordion-controlled";
import accordion_demo from "./default/examples/accordion-demo";
import accordion_disabled from "./default/examples/accordion-disabled";
import accordion_card from "./default/examples/accordion-in-card";
import accordion_leading_icon from "./default/examples/accordion-leading-icon";
import accordion_multiple from "./default/examples/accordion-multiple";
import accordion_single from "./default/examples/accordion-single";
import accordion_user_roles from "./default/examples/accordion-user-roles";
import accordion_with_icons from "./default/examples/accordion-with-icons";
import alert_demo from "./default/examples/alert-demo";
import alert_dialog_demo from "./default/examples/alert-dialog-demo";
import alert_error from "./default/examples/alert-error";
import alert_info from "./default/examples/alert-info";
import alert_success from "./default/examples/alert-success";
import alert_warning from "./default/examples/alert-warning";
import alert_with_icon from "./default/examples/alert-with-icon";
import alert_with_icon_action from "./default/examples/alert-with-icon-action";
import autocomplete_async from "./default/examples/autocomplete-async";
import autocomplete_autohighlight from "./default/examples/autocomplete-autohighlight";
import autocomplete_demo from "./default/examples/autocomplete-demo";
import autocomplete_disabled from "./default/examples/autocomplete-disabled";
import autocomplete_form from "./default/examples/autocomplete-form";
import autocomplete_grouped from "./default/examples/autocomplete-grouped";
import autocomplete_inline from "./default/examples/autocomplete-inline";
import autocomplete_lg from "./default/examples/autocomplete-lg";
import autocomplete_limit from "./default/examples/autocomplete-limit";
import autocomplete_sm from "./default/examples/autocomplete-sm";
import autocomplete_with_clear from "./default/examples/autocomplete-with-clear";
import autocomplete_with_label from "./default/examples/autocomplete-with-label";
import autocomplete_with_trigger_clear from "./default/examples/autocomplete-with-trigger-clear";
import avatar_demo from "./default/examples/avatar-demo";
import avatar_badge_icons from "./default/examples/avatar-badge-icons";
import avatar_badge_position from "./default/examples/avatar-badge-position";
import avatar_empty_collaborators from "./default/examples/avatar-empty-collaborators";
import avatar_fallback from "./default/examples/avatar-fallback";
import avatar_group from "./default/examples/avatar-group";
import avatar_group_trust from "./default/examples/avatar-group-trust";
import avatar_loading from "./default/examples/avatar-loading";
import avatar_menu from "./default/examples/avatar-menu";
import avatar_profile_badge from "./default/examples/avatar-profile-badge";
import avatar_radius from "./default/examples/avatar-radius";
import avatar_size from "./default/examples/avatar-size";
import avatar_status from "./default/examples/avatar-status";
import badge_demo from "./default/examples/badge-demo";
import badge_destructive from "./default/examples/badge-destructive";
import badge_error from "./default/examples/badge-error";
import badge_info from "./default/examples/badge-info";
import badge_lg from "./default/examples/badge-lg";
import badge_outline from "./default/examples/badge-outline";
import badge_secondary from "./default/examples/badge-secondary";
import badge_sm from "./default/examples/badge-sm";
import badge_success from "./default/examples/badge-success";
import badge_warning from "./default/examples/badge-warning";
import badge_with_icon from "./default/examples/badge-with-icon";
import badge_with_link from "./default/examples/badge-with-link";
import breadcrumb_bullet_separator from "./default/examples/breadcrumb-bullet-separator";
import breadcrumb_buttons from "./default/examples/breadcrumb-buttons";
import breadcrumb_card from "./default/examples/breadcrumb-card";
import breadcrumb_custom_separator from "./default/examples/breadcrumb-custom-separator";
import breadcrumb_demo from "./default/examples/breadcrumb-demo";
import button_appearances from "./default/examples/button-appearances";
import button_async_action from "./default/examples/button-async-action";
import button_default from "./default/examples/button-default";
import button_default_icons from "./default/examples/button-default-icons";
import button_demo from "./default/examples/button-demo";
import button_destructive from "./default/examples/button-destructive";
import button_destructive_icons from "./default/examples/button-destructive-icons";
import button_destructive_outline from "./default/examples/button-destructive-outline";
import button_destructive_outline_icons from "./default/examples/button-destructive-outline-icons";
import button_disabled from "./default/examples/button-disabled";
import button_ghost from "./default/examples/button-ghost";
import button_ghost_icons from "./default/examples/button-ghost-icons";
import button_form_submit from "./default/examples/button-form-submit";
import button_long_text from "./default/examples/button-long-text";
import button_icon from "./default/examples/button-icon";
import button_icon_lg from "./default/examples/button-icon-lg";
import button_icon_sm from "./default/examples/button-icon-sm";
import button_lg from "./default/examples/button-lg";
import button_link from "./default/examples/button-link";
import button_link_icons from "./default/examples/button-link-icons";
import button_loading from "./default/examples/button-loading";
import button_outline from "./default/examples/button-outline";
import button_outline_icons from "./default/examples/button-outline-icons";
import button_rtl from "./default/examples/button-rtl";
import button_secondary from "./default/examples/button-secondary";
import button_secondary_icons from "./default/examples/button-secondary-icons";
import button_sm from "./default/examples/button-sm";
import button_theme_toggle from "./default/examples/button-theme-toggle";
import button_with_icon from "./default/examples/button-with-icon";
import button_with_link from "./default/examples/button-with-link";
import button_xl from "./default/examples/button-xl";
import button_xs from "./default/examples/button-xs";
import card_demo from "./default/examples/card-demo";
import checkbox_card from "./default/examples/checkbox-card";
import checkbox_demo from "./default/examples/checkbox-demo";
import checkbox_disabled from "./default/examples/checkbox-disabled";
import checkbox_form from "./default/examples/checkbox-form";
import checkbox_group_demo from "./default/examples/checkbox-group-demo";
import checkbox_group_disabled from "./default/examples/checkbox-group-disabled";
import checkbox_group_form from "./default/examples/checkbox-group-form";
import checkbox_group_nested_parent from "./default/examples/checkbox-group-nested-parent";
import checkbox_group_parent from "./default/examples/checkbox-group-parent";
import checkbox_with_description from "./default/examples/checkbox-with-description";
import collapsible_demo from "./default/examples/collapsible-demo";
import combobox_autohighlight from "./default/examples/combobox-autohighlight";
import combobox_demo from "./default/examples/combobox-demo";
import combobox_disabled from "./default/examples/combobox-disabled";
import combobox_form from "./default/examples/combobox-form";
import combobox_grouped from "./default/examples/combobox-grouped";
import combobox_lg from "./default/examples/combobox-lg";
import combobox_multiple from "./default/examples/combobox-multiple";
import combobox_multiple_form from "./default/examples/combobox-multiple-form";
import combobox_sm from "./default/examples/combobox-sm";
import combobox_with_clear from "./default/examples/combobox-with-clear";
import combobox_with_inner_input from "./default/examples/combobox-with-inner-input";
import combobox_with_label from "./default/examples/combobox-with-label";
import command_demo from "./default/examples/command-demo";
import command_dialog from "./default/examples/command-dialog";
import context_menu_demo from "./default/examples/context-menu-demo";
import context_menu_search from "./default/examples/context-menu-search";
import color_picker_controlled from "./default/examples/color-picker-controlled";
import color_picker_demo from "./default/examples/color-picker-demo";
import data_grid_columns from "./default/examples/data-grid-columns";
import data_grid_controlled from "./default/examples/data-grid-controlled";
import data_grid_demo from "./default/examples/data-grid-demo";
import data_grid_density from "./default/examples/data-grid-density";
import data_grid_editing from "./default/examples/data-grid-editing";
import data_grid_filters from "./default/examples/data-grid-filters";
import data_grid_selection from "./default/examples/data-grid-selection";
import data_grid_states from "./default/examples/data-grid-states";
import data_grid_virtualized from "./default/examples/data-grid-virtualized";
import data_table_custom_cells from "./default/examples/data-table-custom-cells";
import data_table_demo from "./default/examples/data-table-demo";
import data_table_empty from "./default/examples/data-table-empty";
import data_table_error from "./default/examples/data-table-error";
import data_table_loading from "./default/examples/data-table-loading";
import data_table_search_filters from "./default/examples/data-table-search-filters";
import data_table_selection from "./default/examples/data-table-selection";
import data_table_server from "./default/examples/data-table-server";
import date_range_picker_confirm from "./default/examples/date-range-picker-confirm";
import date_range_picker_controlled from "./default/examples/date-range-picker-controlled";
import date_range_picker_default from "./default/examples/date-range-picker-default";
import date_range_picker_demo from "./default/examples/date-range-picker-demo";
import date_range_picker_form from "./default/examples/date-range-picker-form";
import date_range_picker_limits from "./default/examples/date-range-picker-limits";
import date_range_picker_presets from "./default/examples/date-range-picker-presets";
import date_range_picker_single_month from "./default/examples/date-range-picker-single-month";
import dialog_close_confirmation from "./default/examples/dialog-close-confirmation";
import dialog_destructive_confirm from "./default/examples/dialog-destructive-confirm";
import dialog_demo from "./default/examples/dialog-demo";
import dialog_form_submit from "./default/examples/dialog-form-submit";
import dialog_from_menu from "./default/examples/dialog-from-menu";
import dialog_nested from "./default/examples/dialog-nested";
import empty_demo from "./default/examples/empty-demo";
import field_autocomplete from "./default/examples/field-autocomplete";
import field_checkbox from "./default/examples/field-checkbox";
import field_checkbox_group from "./default/examples/field-checkbox-group";
import field_combobox from "./default/examples/field-combobox";
import field_combobox_multiple from "./default/examples/field-combobox-multiple";
import field_complete_form from "./default/examples/field-complete-form";
import field_demo from "./default/examples/field-demo";
import field_disabled from "./default/examples/field-disabled";
import field_error from "./default/examples/field-error";
import field_number_field from "./default/examples/field-number-field";
import field_radio from "./default/examples/field-radio";
import field_required from "./default/examples/field-required";
import field_select from "./default/examples/field-select";
import field_slider from "./default/examples/field-slider";
import field_switch from "./default/examples/field-switch";
import field_textarea from "./default/examples/field-textarea";
import field_validity from "./default/examples/field-validity";
import fieldset_demo from "./default/examples/fieldset-demo";
import form_demo from "./default/examples/form-demo";
import form_zod from "./default/examples/form-zod";
import frame_demo from "./default/examples/frame-demo";
import gooey_toast_demo from "./default/examples/gooey-toast-demo";
import gooey_toast_position from "./default/examples/gooey-toast-position";
import gooey_toast_promise from "./default/examples/gooey-toast-promise";
import gooey_toast_states from "./default/examples/gooey-toast-states";
import gooey_toast_with_button from "./default/examples/gooey-toast-with-button";
import group_demo from "./default/examples/group-demo";
import group_with_input from "./default/examples/group-with-input";
import input_demo from "./default/examples/input-demo";
import input_disabled from "./default/examples/input-disabled";
import input_file from "./default/examples/input-file";
import input_lg from "./default/examples/input-lg";
import input_long_text from "./default/examples/input-long-text";
import input_rtl from "./default/examples/input-rtl";
import input_sizes from "./default/examples/input-sizes";
import input_states from "./default/examples/input-states";
import input_sm from "./default/examples/input-sm";
import input_with_button from "./default/examples/input-with-button";
import input_with_label from "./default/examples/input-with-label";
import input_group_search from "./default/examples/input-group-search";
import input_group_textarea from "./default/examples/input-group-textarea";
import input_group_url from "./default/examples/input-group-url";
import kanban_list_kanban_demo from "./default/examples/kanban-list-kanban-demo";
import kanban_list_list_demo from "./default/examples/kanban-list-list-demo";
import menu_checkbox from "./default/examples/menu-checkbox";
import menu_close_on_click from "./default/examples/menu-close-on-click";
import menu_demo from "./default/examples/menu-demo";
import menu_group_labels from "./default/examples/menu-group-labels";
import menu_hover from "./default/examples/menu-hover";
import menu_link from "./default/examples/menu-link";
import menu_nested from "./default/examples/menu-nested";
import menu_radio_group from "./default/examples/menu-radio-group";
import menu_scrollable from "./default/examples/menu-scrollable";
import meter_circular_sizes from "./default/examples/meter-circular-sizes";
import meter_circular_statuses from "./default/examples/meter-circular-statuses";
import meter_demo from "./default/examples/meter-demo";
import meter_simple from "./default/examples/meter-simple";
import meter_with_formatted_value from "./default/examples/meter-with-formatted-value";
import meter_with_range from "./default/examples/meter-with-range";
import number_field_demo from "./default/examples/number-field-demo";
import number_field_disabled from "./default/examples/number-field-disabled";
import number_field_form from "./default/examples/number-field-form";
import number_field_lg from "./default/examples/number-field-lg";
import number_field_sm from "./default/examples/number-field-sm";
import number_field_with_formatted_value from "./default/examples/number-field-with-formatted-value";
import number_field_with_label from "./default/examples/number-field-with-label";
import number_field_with_range from "./default/examples/number-field-with-range";
import number_field_with_scrub from "./default/examples/number-field-with-scrub";
import number_field_with_step from "./default/examples/number-field-with-step";
import pagination_demo from "./default/examples/pagination-demo";
import popover_demo from "./default/examples/popover-demo";
import popover_with_close from "./default/examples/popover-with-close";
import preview_card_demo from "./default/examples/preview-card-demo";
import progress_demo from "./default/examples/progress-demo";
import progress_with_formatted_value from "./default/examples/progress-with-formatted-value";
import progress_with_label_value from "./default/examples/progress-with-label-value";
import radio_group_card from "./default/examples/radio-group-card";
import radio_group_demo from "./default/examples/radio-group-demo";
import radio_group_disabled from "./default/examples/radio-group-disabled";
import radio_group_form from "./default/examples/radio-group-form";
import radio_group_error from "./default/examples/radio-group-error";
import radio_group_with_description from "./default/examples/radio-group-with-description";
import scroll_area_both from "./default/examples/scroll-area-both";
import scroll_area_demo from "./default/examples/scroll-area-demo";
import scroll_area_horizontal from "./default/examples/scroll-area-horizontal";
import select_demo from "./default/examples/select-demo";
import select_disabled from "./default/examples/select-disabled";
import select_form from "./default/examples/select-form";
import select_lg from "./default/examples/select-lg";
import select_multiple from "./default/examples/select-multiple";
import select_sm from "./default/examples/select-sm";
import select_with_groups from "./default/examples/select-with-groups";
import select_without_alignment from "./default/examples/select-without-alignment";
import separator_demo from "./default/examples/separator-demo";
import sheet_demo from "./default/examples/sheet-demo";
import sheet_position from "./default/examples/sheet-position";
import skeleton_demo from "./default/examples/skeleton-demo";
import skeleton_only from "./default/examples/skeleton-only";
import slider_demo from "./default/examples/slider-demo";
import slider_form from "./default/examples/slider-form";
import slider_disabled from "./default/examples/slider-disabled";
import slider_range from "./default/examples/slider-range";
import slider_vertical from "./default/examples/slider-vertical";
import slider_with_label_value from "./default/examples/slider-with-label-value";
import switch_card from "./default/examples/switch-card";
import switch_demo from "./default/examples/switch-demo";
import switch_disabled from "./default/examples/switch-disabled";
import switch_form from "./default/examples/switch-form";
import switch_with_description from "./default/examples/switch-with-description";
import switch_pending from "./default/examples/switch-pending";
import table_demo from "./default/examples/table-demo";
import table_framed from "./default/examples/table-framed";
import tabs_demo from "./default/examples/tabs-demo";
import tabs_underline from "./default/examples/tabs-underline";
import tabs_underline_vertical from "./default/examples/tabs-underline-vertical";
import tabs_vertical from "./default/examples/tabs-vertical";
import textarea_demo from "./default/examples/textarea-demo";
import textarea_disabled from "./default/examples/textarea-disabled";
import textarea_form from "./default/examples/textarea-form";
import textarea_lg from "./default/examples/textarea-lg";
import textarea_sm from "./default/examples/textarea-sm";
import textarea_with_label from "./default/examples/textarea-with-label";
import toast_demo from "./default/examples/toast-demo";
import toast_heights from "./default/examples/toast-heights";
import toast_loading from "./default/examples/toast-loading";
import toast_promise from "./default/examples/toast-promise";
import toast_with_action from "./default/examples/toast-with-action";
import toast_with_status from "./default/examples/toast-with-status";
import toggle_demo from "./default/examples/toggle-demo";
import toggle_disabled from "./default/examples/toggle-disabled";
import toggle_group_demo from "./default/examples/toggle-group-demo";
import toggle_group_disabled from "./default/examples/toggle-group-disabled";
import toggle_group_lg from "./default/examples/toggle-group-lg";
import toggle_group_multiple from "./default/examples/toggle-group-multiple";
import toggle_group_outline from "./default/examples/toggle-group-outline";
import toggle_group_outline_with_separator from "./default/examples/toggle-group-outline-with-separator";
import toggle_group_sm from "./default/examples/toggle-group-sm";
import toggle_group_with_disabled_item from "./default/examples/toggle-group-with-disabled-item";
import toggle_icon_group from "./default/examples/toggle-icon-group";
import toggle_lg from "./default/examples/toggle-lg";
import toggle_outline from "./default/examples/toggle-outline";
import toggle_sm from "./default/examples/toggle-sm";
import toggle_with_icon from "./default/examples/toggle-with-icon";
import toolbar_demo from "./default/examples/toolbar-demo";
import tooltip_demo from "./default/examples/tooltip-demo";
import tooltip_grouped from "./default/examples/tooltip-grouped";

import accordion_product_faq from "./default/examples/accordion-product-faq";
import alert_billing_notice from "./default/examples/alert-billing-notice";
import autocomplete_members from "./default/examples/autocomplete-members";
import avatar_team_stack from "./default/examples/avatar-team-stack";
import badge_release_status from "./default/examples/badge-release-status";
import breadcrumb_workspace_path from "./default/examples/breadcrumb-workspace-path";
import breadcrumb_compact_path from "./default/examples/breadcrumb-compact-path";
import breadcrumb_with_ellipsis from "./default/examples/breadcrumb-with-ellipsis";
import button_command_bar from "./default/examples/button-command-bar";
import card_author_profile from "./default/examples/card-author-profile";
import card_metric_summary from "./default/examples/card-metric-summary";
import card_billing_plan from "./default/examples/card-billing-plan";
import card_default_size from "./default/examples/card-default-size";
import card_depth from "./default/examples/card-depth";
import card_help_link from "./default/examples/card-help-link";
import card_help_menu from "./default/examples/card-help-menu";
import card_image_centered from "./default/examples/card-image-centered";
import card_image_feature from "./default/examples/card-image-feature";
import card_metric_actions from "./default/examples/card-metric-actions";
import card_resource_link from "./default/examples/card-resource-link";
import card_team_member from "./default/examples/card-team-member";
import card_usage_expandable from "./default/examples/card-usage-expandable";
import card_with_borders from "./default/examples/card-with-borders";
import checkbox_notification_row from "./default/examples/checkbox-notification-row";
import collapsible_release_notes from "./default/examples/collapsible-release-notes";
import collapsible_checklist from "./default/examples/collapsible-checklist";
import collapsible_command_help from "./default/examples/collapsible-command-help";
import combobox_assignee from "./default/examples/combobox-assignee";
import dialog_invite_member from "./default/examples/dialog-invite-member";
import empty_inbox_zero from "./default/examples/empty-inbox-zero";
import empty_filtered_results from "./default/examples/empty-filtered-results";
import empty_upload_queue from "./default/examples/empty-upload-queue";
import field_password from "./default/examples/field-password";
import fieldset_notification_settings from "./default/examples/fieldset-notification-settings";
import fieldset_billing_address from "./default/examples/fieldset-billing-address";
import fieldset_danger_zone from "./default/examples/fieldset-danger-zone";
import form_profile_card from "./default/examples/form-profile-card";
import form_newsletter from "./default/examples/form-newsletter";
import frame_analytics_panel from "./default/examples/frame-analytics-panel";
import frame_device_preview from "./default/examples/frame-device-preview";
import frame_code_output from "./default/examples/frame-code-output";
import group_filter_actions from "./default/examples/group-filter-actions";
import group_segmented_filters from "./default/examples/group-segmented-filters";
import group_toolbar_actions from "./default/examples/group-toolbar-actions";
import input_search_inline from "./default/examples/input-search-inline";
import label_password_field from "./default/examples/label-password-field";
import menu_project_actions from "./default/examples/menu-project-actions";
import meter_storage_quota from "./default/examples/meter-storage-quota";
import number_field_ticket_count from "./default/examples/number-field-ticket-count";
import pagination_compact from "./default/examples/pagination-compact";
import pagination_mini from "./default/examples/pagination-mini";
import pagination_results from "./default/examples/pagination-results";
import popover_account_summary from "./default/examples/popover-account-summary";
import popover_color_swatch from "./default/examples/popover-color-swatch";
import preview_card_repository from "./default/examples/preview-card-repository";
import preview_card_product from "./default/examples/preview-card-product";
import preview_card_profile from "./default/examples/preview-card-profile";
import progress_onboarding from "./default/examples/progress-onboarding";
import radio_group_delivery from "./default/examples/radio-group-delivery";
import scroll_area_activity from "./default/examples/scroll-area-activity";
import select_timezone from "./default/examples/select-timezone";
import separator_section_label from "./default/examples/separator-section-label";
import separator_timeline from "./default/examples/separator-timeline";
import separator_vertical_stack from "./default/examples/separator-vertical-stack";
import sheet_checkout_summary from "./default/examples/sheet-checkout-summary";
import sheet_profile_editor from "./default/examples/sheet-profile-editor";
import skeleton_dashboard_card from "./default/examples/skeleton-dashboard-card";
import skeleton_chat_list from "./default/examples/skeleton-chat-list";
import slider_opacity from "./default/examples/slider-opacity";
import switch_privacy_mode from "./default/examples/switch-privacy-mode";
import table_invoice_list from "./default/examples/table-invoice-list";
import table_user_roles from "./default/examples/table-user-roles";
import tabs_settings from "./default/examples/tabs-settings";
import textarea_feedback from "./default/examples/textarea-feedback";
import toast_sync_complete from "./default/examples/toast-sync-complete";
import toggle_view_mode from "./default/examples/toggle-view-mode";
import toolbar_canvas_controls from "./default/examples/toolbar-canvas-controls";
import toolbar_media_controls from "./default/examples/toolbar-media-controls";
import toolbar_density_controls from "./default/examples/toolbar-density-controls";
import tooltip_icon_row from "./default/examples/tooltip-icon-row";
import tooltip_keyboard_hints from "./default/examples/tooltip-keyboard-hints";

export const Index: Record<string, { component: ComponentType }> = {
  ...AnimatedIndex,
  ...ChartIndex,
  ...ShaderIndex,
  "accordion-product-faq": { component: accordion_product_faq },
  "accordion-card": { component: accordion_card },
  "alert-billing-notice": { component: alert_billing_notice },
  "autocomplete-members": { component: autocomplete_members },
  "avatar-team-stack": { component: avatar_team_stack },
  "badge-release-status": { component: badge_release_status },
  "breadcrumb-workspace-path": { component: breadcrumb_workspace_path },
  "breadcrumb-compact-path": { component: breadcrumb_compact_path },
  "breadcrumb-with-ellipsis": { component: breadcrumb_with_ellipsis },
  "button-command-bar": { component: button_command_bar },
  "card-author-profile": { component: card_author_profile },
  "card-metric-summary": { component: card_metric_summary },
  "card-billing-plan": { component: card_billing_plan },
  "card-default-size": { component: card_default_size },
  "card-depth": { component: card_depth },
  "card-help-link": { component: card_help_link },
  "card-help-menu": { component: card_help_menu },
  "card-image-centered": { component: card_image_centered },
  "card-image-feature": { component: card_image_feature },
  "card-metric-actions": { component: card_metric_actions },
  "card-resource-link": { component: card_resource_link },
  "card-team-member": { component: card_team_member },
  "card-usage-expandable": { component: card_usage_expandable },
  "card-with-borders": { component: card_with_borders },
  "checkbox-notification-row": { component: checkbox_notification_row },
  "collapsible-release-notes": { component: collapsible_release_notes },
  "collapsible-checklist": { component: collapsible_checklist },
  "collapsible-command-help": { component: collapsible_command_help },
  "combobox-assignee": { component: combobox_assignee },
  "dialog-invite-member": { component: dialog_invite_member },
  "empty-inbox-zero": { component: empty_inbox_zero },
  "empty-filtered-results": { component: empty_filtered_results },
  "empty-upload-queue": { component: empty_upload_queue },
  "field-password": { component: field_password },
  "fieldset-notification-settings": {
    component: fieldset_notification_settings,
  },
  "fieldset-billing-address": { component: fieldset_billing_address },
  "fieldset-danger-zone": { component: fieldset_danger_zone },
  "form-profile-card": { component: form_profile_card },
  "form-newsletter": { component: form_newsletter },
  "frame-analytics-panel": { component: frame_analytics_panel },
  "frame-device-preview": { component: frame_device_preview },
  "frame-code-output": { component: frame_code_output },
  "group-filter-actions": { component: group_filter_actions },
  "group-segmented-filters": { component: group_segmented_filters },
  "group-toolbar-actions": { component: group_toolbar_actions },
  "input-search-inline": { component: input_search_inline },
  "label-password-field": { component: label_password_field },
  "menu-project-actions": { component: menu_project_actions },
  "meter-storage-quota": { component: meter_storage_quota },
  "number-field-ticket-count": { component: number_field_ticket_count },
  "pagination-compact": { component: pagination_compact },
  "pagination-mini": { component: pagination_mini },
  "pagination-results": { component: pagination_results },
  "popover-account-summary": { component: popover_account_summary },
  "popover-color-swatch": { component: popover_color_swatch },
  "preview-card-repository": { component: preview_card_repository },
  "preview-card-product": { component: preview_card_product },
  "preview-card-profile": { component: preview_card_profile },
  "progress-onboarding": { component: progress_onboarding },
  "radio-group-delivery": { component: radio_group_delivery },
  "scroll-area-activity": { component: scroll_area_activity },
  "select-timezone": { component: select_timezone },
  "separator-section-label": { component: separator_section_label },
  "separator-timeline": { component: separator_timeline },
  "separator-vertical-stack": { component: separator_vertical_stack },
  "sheet-checkout-summary": { component: sheet_checkout_summary },
  "sheet-profile-editor": { component: sheet_profile_editor },
  "skeleton-dashboard-card": { component: skeleton_dashboard_card },
  "skeleton-chat-list": { component: skeleton_chat_list },
  "slider-opacity": { component: slider_opacity },
  "switch-privacy-mode": { component: switch_privacy_mode },
  "table-invoice-list": { component: table_invoice_list },
  "table-user-roles": { component: table_user_roles },
  "tabs-settings": { component: tabs_settings },
  "textarea-feedback": { component: textarea_feedback },
  "toast-sync-complete": { component: toast_sync_complete },
  "toggle-view-mode": { component: toggle_view_mode },
  "toolbar-canvas-controls": { component: toolbar_canvas_controls },
  "toolbar-media-controls": { component: toolbar_media_controls },
  "toolbar-density-controls": { component: toolbar_density_controls },
  "tooltip-icon-row": { component: tooltip_icon_row },
  "tooltip-keyboard-hints": { component: tooltip_keyboard_hints },
  "accordion-controlled": { component: accordion_controlled },
  "accordion-demo": { component: accordion_demo },
  "accordion-disabled": { component: accordion_disabled },
  "accordion-in-card": { component: accordion_card },
  "accordion-leading-icon": { component: accordion_leading_icon },
  "accordion-multiple": { component: accordion_multiple },
  "accordion-single": { component: accordion_single },
  "accordion-user-roles": { component: accordion_user_roles },
  "accordion-with-icons": { component: accordion_with_icons },
  "alert-demo": { component: alert_demo },
  "alert-dialog-demo": { component: alert_dialog_demo },
  "alert-error": { component: alert_error },
  "alert-info": { component: alert_info },
  "alert-success": { component: alert_success },
  "alert-warning": { component: alert_warning },
  "alert-with-icon": { component: alert_with_icon },
  "alert-with-icon-action": { component: alert_with_icon_action },
  "autocomplete-async": { component: autocomplete_async },
  "autocomplete-autohighlight": { component: autocomplete_autohighlight },
  "autocomplete-demo": { component: autocomplete_demo },
  "autocomplete-disabled": { component: autocomplete_disabled },
  "autocomplete-form": { component: autocomplete_form },
  "autocomplete-grouped": { component: autocomplete_grouped },
  "autocomplete-inline": { component: autocomplete_inline },
  "autocomplete-lg": { component: autocomplete_lg },
  "autocomplete-limit": { component: autocomplete_limit },
  "autocomplete-sm": { component: autocomplete_sm },
  "autocomplete-with-clear": { component: autocomplete_with_clear },
  "autocomplete-with-label": { component: autocomplete_with_label },
  "autocomplete-with-trigger-clear": {
    component: autocomplete_with_trigger_clear,
  },
  "avatar-badge-icons": { component: avatar_badge_icons },
  "avatar-badge-position": { component: avatar_badge_position },
  "avatar-demo": { component: avatar_demo },
  "avatar-empty-collaborators": { component: avatar_empty_collaborators },
  "avatar-fallback": { component: avatar_fallback },
  "avatar-group": { component: avatar_group },
  "avatar-group-trust": { component: avatar_group_trust },
  "avatar-loading": { component: avatar_loading },
  "avatar-menu": { component: avatar_menu },
  "avatar-profile-badge": { component: avatar_profile_badge },
  "avatar-radius": { component: avatar_radius },
  "avatar-size": { component: avatar_size },
  "avatar-status": { component: avatar_status },
  "badge-demo": { component: badge_demo },
  "badge-destructive": { component: badge_destructive },
  "badge-error": { component: badge_error },
  "badge-info": { component: badge_info },
  "badge-lg": { component: badge_lg },
  "badge-outline": { component: badge_outline },
  "badge-secondary": { component: badge_secondary },
  "badge-sm": { component: badge_sm },
  "badge-success": { component: badge_success },
  "badge-warning": { component: badge_warning },
  "badge-with-icon": { component: badge_with_icon },
  "badge-with-link": { component: badge_with_link },
  "breadcrumb-bullet-separator": { component: breadcrumb_bullet_separator },
  "breadcrumb-buttons": { component: breadcrumb_buttons },
  "breadcrumb-card": { component: breadcrumb_card },
  "breadcrumb-custom-separator": { component: breadcrumb_custom_separator },
  "breadcrumb-demo": { component: breadcrumb_demo },
  "button-appearances": { component: button_appearances },
  "button-async-action": { component: button_async_action },
  "button-default": { component: button_default },
  "button-default-icons": { component: button_default_icons },
  "button-demo": { component: button_demo },
  "button-destructive": { component: button_destructive },
  "button-destructive-icons": { component: button_destructive_icons },
  "button-destructive-outline": { component: button_destructive_outline },
  "button-destructive-outline-icons": {
    component: button_destructive_outline_icons,
  },
  "button-disabled": { component: button_disabled },
  "button-ghost": { component: button_ghost },
  "button-form-submit": { component: button_form_submit },
  "button-long-text": { component: button_long_text },
  "button-ghost-icons": { component: button_ghost_icons },
  "button-icon": { component: button_icon },
  "button-icon-lg": { component: button_icon_lg },
  "button-icon-sm": { component: button_icon_sm },
  "button-lg": { component: button_lg },
  "button-link": { component: button_link },
  "button-link-icons": { component: button_link_icons },
  "button-loading": { component: button_loading },
  "button-outline": { component: button_outline },
  "button-outline-icons": { component: button_outline_icons },
  "button-rtl": { component: button_rtl },
  "button-secondary": { component: button_secondary },
  "button-secondary-icons": { component: button_secondary_icons },
  "button-sm": { component: button_sm },
  "button-theme-toggle": { component: button_theme_toggle },
  "button-with-icon": { component: button_with_icon },
  "button-with-link": { component: button_with_link },
  "button-xl": { component: button_xl },
  "button-xs": { component: button_xs },
  "card-demo": { component: card_demo },
  "checkbox-card": { component: checkbox_card },
  "checkbox-demo": { component: checkbox_demo },
  "checkbox-disabled": { component: checkbox_disabled },
  "checkbox-form": { component: checkbox_form },
  "checkbox-group-demo": { component: checkbox_group_demo },
  "checkbox-group-disabled": { component: checkbox_group_disabled },
  "checkbox-group-form": { component: checkbox_group_form },
  "checkbox-group-nested-parent": { component: checkbox_group_nested_parent },
  "checkbox-group-parent": { component: checkbox_group_parent },
  "checkbox-with-description": { component: checkbox_with_description },
  "collapsible-demo": { component: collapsible_demo },
  "combobox-autohighlight": { component: combobox_autohighlight },
  "combobox-demo": { component: combobox_demo },
  "combobox-disabled": { component: combobox_disabled },
  "combobox-form": { component: combobox_form },
  "combobox-grouped": { component: combobox_grouped },
  "combobox-lg": { component: combobox_lg },
  "combobox-multiple": { component: combobox_multiple },
  "combobox-multiple-form": { component: combobox_multiple_form },
  "combobox-sm": { component: combobox_sm },
  "combobox-with-clear": { component: combobox_with_clear },
  "combobox-with-inner-input": { component: combobox_with_inner_input },
  "combobox-with-label": { component: combobox_with_label },
  "command-demo": { component: command_demo },
  "command-dialog": { component: command_dialog },
  "context-menu-demo": { component: context_menu_demo },
  "context-menu-search": { component: context_menu_search },
  "color-picker-controlled": { component: color_picker_controlled },
  "color-picker-demo": { component: color_picker_demo },
  "data-grid-columns": { component: data_grid_columns },
  "data-grid-controlled": { component: data_grid_controlled },
  "data-grid-demo": { component: data_grid_demo },
  "data-grid-density": { component: data_grid_density },
  "data-grid-editing": { component: data_grid_editing },
  "data-grid-filters": { component: data_grid_filters },
  "data-grid-selection": { component: data_grid_selection },
  "data-grid-states": { component: data_grid_states },
  "data-grid-virtualized": { component: data_grid_virtualized },
  "data-table-custom-cells": { component: data_table_custom_cells },
  "data-table-demo": { component: data_table_demo },
  "data-table-empty": { component: data_table_empty },
  "data-table-error": { component: data_table_error },
  "data-table-loading": { component: data_table_loading },
  "data-table-search-filters": { component: data_table_search_filters },
  "data-table-selection": { component: data_table_selection },
  "data-table-server": { component: data_table_server },
  "date-range-picker-confirm": { component: date_range_picker_confirm },
  "date-range-picker-controlled": { component: date_range_picker_controlled },
  "date-range-picker-default": { component: date_range_picker_default },
  "date-range-picker-demo": { component: date_range_picker_demo },
  "date-range-picker-form": { component: date_range_picker_form },
  "date-range-picker-limits": { component: date_range_picker_limits },
  "date-range-picker-presets": { component: date_range_picker_presets },
  "date-range-picker-single-month": { component: date_range_picker_single_month },
  "dialog-close-confirmation": { component: dialog_close_confirmation },
  "dialog-destructive-confirm": { component: dialog_destructive_confirm },
  "dialog-demo": { component: dialog_demo },
  "dialog-from-menu": { component: dialog_from_menu },
  "dialog-form-submit": { component: dialog_form_submit },
  "dialog-nested": { component: dialog_nested },
  "empty-demo": { component: empty_demo },
  "field-autocomplete": { component: field_autocomplete },
  "field-checkbox": { component: field_checkbox },
  "field-checkbox-group": { component: field_checkbox_group },
  "field-combobox": { component: field_combobox },
  "field-combobox-multiple": { component: field_combobox_multiple },
  "field-complete-form": { component: field_complete_form },
  "field-demo": { component: field_demo },
  "field-disabled": { component: field_disabled },
  "field-error": { component: field_error },
  "field-number-field": { component: field_number_field },
  "field-radio": { component: field_radio },
  "field-required": { component: field_required },
  "field-select": { component: field_select },
  "field-slider": { component: field_slider },
  "field-switch": { component: field_switch },
  "field-textarea": { component: field_textarea },
  "field-validity": { component: field_validity },
  "fieldset-demo": { component: fieldset_demo },
  "form-demo": { component: form_demo },
  "form-zod": { component: form_zod },
  "frame-demo": { component: frame_demo },
  "gooey-toast-demo": { component: gooey_toast_demo },
  "gooey-toast-position": { component: gooey_toast_position },
  "gooey-toast-promise": { component: gooey_toast_promise },
  "gooey-toast-states": { component: gooey_toast_states },
  "gooey-toast-with-button": { component: gooey_toast_with_button },
  "group-demo": { component: group_demo },
  "group-with-input": { component: group_with_input },
  "input-demo": { component: input_demo },
  "input-disabled": { component: input_disabled },
  "input-file": { component: input_file },
  "input-lg": { component: input_lg },
  "input-long-text": { component: input_long_text },
  "input-rtl": { component: input_rtl },
  "input-sizes": { component: input_sizes },
  "input-states": { component: input_states },
  "input-sm": { component: input_sm },
  "input-with-button": { component: input_with_button },
  "input-with-label": { component: input_with_label },
  "input-group-search": { component: input_group_search },
  "input-group-textarea": { component: input_group_textarea },
  "input-group-url": { component: input_group_url },
  "kanban-list-kanban-demo": { component: kanban_list_kanban_demo },
  "kanban-list-list-demo": { component: kanban_list_list_demo },
  "menu-checkbox": { component: menu_checkbox },
  "menu-close-on-click": { component: menu_close_on_click },
  "menu-demo": { component: menu_demo },
  "menu-group-labels": { component: menu_group_labels },
  "menu-hover": { component: menu_hover },
  "menu-link": { component: menu_link },
  "menu-nested": { component: menu_nested },
  "menu-radio-group": { component: menu_radio_group },
  "menu-scrollable": { component: menu_scrollable },
  "meter-circular-sizes": { component: meter_circular_sizes },
  "meter-circular-statuses": { component: meter_circular_statuses },
  "meter-demo": { component: meter_demo },
  "meter-simple": { component: meter_simple },
  "meter-with-formatted-value": { component: meter_with_formatted_value },
  "meter-with-range": { component: meter_with_range },
  "number-field-demo": { component: number_field_demo },
  "number-field-disabled": { component: number_field_disabled },
  "number-field-form": { component: number_field_form },
  "number-field-lg": { component: number_field_lg },
  "number-field-sm": { component: number_field_sm },
  "number-field-with-formatted-value": {
    component: number_field_with_formatted_value,
  },
  "number-field-with-label": { component: number_field_with_label },
  "number-field-with-range": { component: number_field_with_range },
  "number-field-with-scrub": { component: number_field_with_scrub },
  "number-field-with-step": { component: number_field_with_step },
  "pagination-demo": { component: pagination_demo },
  "popover-demo": { component: popover_demo },
  "popover-with-close": { component: popover_with_close },
  "preview-card-demo": { component: preview_card_demo },
  "progress-demo": { component: progress_demo },
  "progress-with-formatted-value": { component: progress_with_formatted_value },
  "progress-with-label-value": { component: progress_with_label_value },
  "radio-group-card": { component: radio_group_card },
  "radio-group-demo": { component: radio_group_demo },
  "radio-group-disabled": { component: radio_group_disabled },
  "radio-group-error": { component: radio_group_error },
  "radio-group-form": { component: radio_group_form },
  "radio-group-with-description": { component: radio_group_with_description },
  "scroll-area-both": { component: scroll_area_both },
  "scroll-area-demo": { component: scroll_area_demo },
  "scroll-area-horizontal": { component: scroll_area_horizontal },
  "select-demo": { component: select_demo },
  "select-disabled": { component: select_disabled },
  "select-form": { component: select_form },
  "select-lg": { component: select_lg },
  "select-multiple": { component: select_multiple },
  "select-sm": { component: select_sm },
  "select-with-groups": { component: select_with_groups },
  "select-without-alignment": { component: select_without_alignment },
  "separator-demo": { component: separator_demo },
  "sheet-demo": { component: sheet_demo },
  "sheet-position": { component: sheet_position },
  "skeleton-demo": { component: skeleton_demo },
  "skeleton-only": { component: skeleton_only },
  "slider-demo": { component: slider_demo },
  "slider-disabled": { component: slider_disabled },
  "slider-form": { component: slider_form },
  "slider-range": { component: slider_range },
  "slider-vertical": { component: slider_vertical },
  "slider-with-label-value": { component: slider_with_label_value },
  "switch-card": { component: switch_card },
  "switch-demo": { component: switch_demo },
  "switch-disabled": { component: switch_disabled },
  "switch-form": { component: switch_form },
  "switch-pending": { component: switch_pending },
  "switch-with-description": { component: switch_with_description },
  "table-demo": { component: table_demo },
  "table-framed": { component: table_framed },
  "tabs-demo": { component: tabs_demo },
  "tabs-underline": { component: tabs_underline },
  "tabs-underline-vertical": { component: tabs_underline_vertical },
  "tabs-vertical": { component: tabs_vertical },
  "textarea-demo": { component: textarea_demo },
  "textarea-disabled": { component: textarea_disabled },
  "textarea-form": { component: textarea_form },
  "textarea-lg": { component: textarea_lg },
  "textarea-sm": { component: textarea_sm },
  "textarea-with-label": { component: textarea_with_label },
  "toast-demo": { component: toast_demo },
  "toast-heights": { component: toast_heights },
  "toast-loading": { component: toast_loading },
  "toast-promise": { component: toast_promise },
  "toast-with-action": { component: toast_with_action },
  "toast-with-status": { component: toast_with_status },
  "toggle-demo": { component: toggle_demo },
  "toggle-disabled": { component: toggle_disabled },
  "toggle-group-demo": { component: toggle_group_demo },
  "toggle-group-disabled": { component: toggle_group_disabled },
  "toggle-group-lg": { component: toggle_group_lg },
  "toggle-group-multiple": { component: toggle_group_multiple },
  "toggle-group-outline": { component: toggle_group_outline },
  "toggle-group-outline-with-separator": {
    component: toggle_group_outline_with_separator,
  },
  "toggle-group-sm": { component: toggle_group_sm },
  "toggle-group-with-disabled-item": {
    component: toggle_group_with_disabled_item,
  },
  "toggle-icon-group": { component: toggle_icon_group },
  "toggle-lg": { component: toggle_lg },
  "toggle-outline": { component: toggle_outline },
  "toggle-sm": { component: toggle_sm },
  "toggle-with-icon": { component: toggle_with_icon },
  "toolbar-demo": { component: toolbar_demo },
  "tooltip-demo": { component: tooltip_demo },
  "tooltip-grouped": { component: tooltip_grouped },
};
