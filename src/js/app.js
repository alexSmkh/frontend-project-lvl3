import i18next from 'i18next';
import resources from './locales/index.js';

import initView from './view.js';
import { buildRssListContainer } from './components.js';
import { setValidationLocale } from './validation.js';
import {
  handleFormInput,
  handleFormSubmit,
  handleSwitchLanguage,
  handleClickOnRssList,
  handleClickOnPostList,
} from './handlers.js';

const initDOMElements = () => {
  const submit = document.getElementById('add-content-btn');
  const input = document.getElementById('rss-input');
  const form = document.getElementById('rss-form');
  const languageSwitchingBtnsContainer = document.querySelector(
    '[data-toggle="langs"]',
  );
  const postListContainerTemplate = document.getElementById('post-list-container-template').content;
  const postListOverflowContainer = postListContainerTemplate.querySelector(
    '[name="overflow-post-list"]',
  );

  const rssListContainerTemplate = document.getElementById(
    'rss-list-container-template',
  ).content;
  const rssListOverflowContainer = rssListContainerTemplate.querySelector(
    '[name="overflow-rss-source-list"]',
  );

  return {
    submit,
    input,
    form,
    languageSwitchingBtnsContainer,
    postListOverflowContainer,
    rssListOverflowContainer,
  };
};

const runApp = (state, i18n) => {
  const elements = initDOMElements();
  const watchedState = initView(state, elements, i18n);
  const {
    input,
    form,
    languageSwitchingBtnsContainer,
    postListOverflowContainer,
    rssListOverflowContainer,
  } = elements;

  languageSwitchingBtnsContainer.addEventListener(
    'click',
    handleSwitchLanguage(watchedState),
  );
  rssListOverflowContainer.addEventListener(
    'click',
    handleClickOnRssList(watchedState),
  );
  postListOverflowContainer.addEventListener(
    'click',
    handleClickOnPostList(watchedState),
  );
  input.addEventListener('input', handleFormInput(watchedState));
  form.addEventListener('submit', (e) => handleFormSubmit(watchedState, e));
};

export default async () => {
  setValidationLocale();

  const defaultLanguage = 'en';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    resources,
  });

  const state = {
    form: {
      valid: false,
      processState: 'filling',
      fields: {
        input: '',
      },
      error: null,
    },
    rssSources: [],
    activeSourceId: null,
    posts: [],
    readPostIDs: new Set(),
    language: defaultLanguage,
    isUpdateProcessRunning: false,
  };
  runApp(state, i18nInstance);
};
