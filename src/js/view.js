import onChange from 'on-change';
import _ from 'lodash';
import i18n from 'i18next';
import { number } from 'yup';

const changeLanguage = (language) => {
  i18n.changeLanguage(language);
  const btns = document.querySelectorAll('[name="change-language"]');
  btns.forEach((btn) => btn.classList.toggle('active'));

  const elementsForTranslate = document.querySelectorAll(
    '[data-translation-key]'
  );
  elementsForTranslate.forEach((element) => {
    const translationKey = element.dataset.translationKey;
    element.textContent = i18n.t(translationKey);
  });

  const rssInput = document.getElementById('rss-input');
  rssInput.setAttribute('placeholder', i18n.t('header.form.placeholder'));
};

const showBtnSpinner = (btn) => {
  const spinner = document.createElement('span');
  spinner.classList.add('spinner-border', 'spinner-border-sm', 'ml-1');
  btn.textContent = i18n.t('header.form.btn.loading');
  btn.appendChild(spinner);
};

const hideBtnSpinner = (btn) => {
  btn.textContent = i18n.t('header.form.btn.content');
};

const getNumberOfUnreadPosts = (rssSourceId, allPosts) => {
  const currentPosts = allPosts.filter((post) => {
    return post.sourceId === rssSourceId;
  });
  const counts = _.countBy(currentPosts, ({ unread }) => unread);
  return counts.true;
};

const hideModalDialog = (modal, modalBackdrop) => {
  modal.style.display = 'none';
  modal.removeAttribute('aria-modal');
  modal.setAttribute('aria-hidden', 'true');
  modalBackdrop.style.display = 'none';
};

const showModalDialog = (post) => {
  const modal = document.getElementById('modal');
  const modalBackdrop = document.querySelector('.modal-backdrop');

  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = post.title;

  const headerCloseBtn = document.querySelector('.modal-header > .close');
  headerCloseBtn.addEventListener('click', () => hideModalDialog(modal));

  const modalBodyContent = document.querySelector('.modal-body > p');
  modalBodyContent.innerHTML = post.description;

  const closeBtn = document.getElementById('modal-close-btn');
  closeBtn.addEventListener('click', () => {
    hideModalDialog(modal, modalBackdrop);
  });
  const openBtn = document.querySelector('[data-open="modal"');
  openBtn.addEventListener('click', () => {
    window.open(post.link, '_blank');
    hideModalDialog(modal, modalBackdrop);
  });

  modal.classList.add('show');
  modal.style.display = 'block';
  modal.setAttribute('aria-modal', 'true');
  modal.removeAttribute('aria-hidden');
  modalBackdrop.style.display = 'block';
};

const buildDeleteIcon = (watchedState, rssSourceOfTargetElement) => {
  const removeIcon = document.createElement('img');
  removeIcon.classList.add('delete-icon', 'ml-2');
  removeIcon.setAttribute('src', 'assets/images/x-circle.svg');
  removeIcon.style.width = '20px';

  removeIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    const updatedRssSources = watchedState.rssSources.reduce(
      (acc, rssSource) => {
        if (rssSource.id !== rssSourceOfTargetElement.id) {
          const rssCopy = _.clone(rssSource);
          rssCopy.lastUpdate = new Date(rssSource.lastUpdate.getTime());
          acc = [...acc, rssCopy];
        }
        return acc;
      },
      []
    );

    const updatedPosts = watchedState.posts.reduce((acc, post) => {
      if (post.sourceId !== rssSourceOfTargetElement.id) {
        acc = [...acc, _.cloneDeep(post)];
      }
      return acc;
    }, []);

    watchedState.posts = updatedPosts;
    watchedState.rssLinks = watchedState.rssLinks.filter(
      (link) => link !== rssSourceOfTargetElement.link
    );

    if (updatedRssSources.length === 0) {
      watchedState.activeSourceId = null;
      watchedState.rssSources = updatedRssSources;
      return;
    }

    if (rssSourceOfTargetElement.id === watchedState.activeSourceId) {
      watchedState.activeSourceId = updatedRssSources[0].id;
    }

    watchedState.rssSources = updatedRssSources;
  });

  removeIcon.addEventListener('mouseover', (e) => {
    e.preventDefault();
    removeIcon.setAttribute('src', 'assets/images/x-circle-fill.svg');
  });

  removeIcon.addEventListener('mouseout', (e) => {
    e.preventDefault();
    removeIcon.setAttribute('src', 'assets/images/x-circle.svg');
  });

  return removeIcon;
};

const updateUnreadPosts = (watchedState, post) => {
  const updatedPosts = watchedState.posts.map((item) => {
    if (item.id !== post.id) return item;
    item.unread = false;
    return item;
  });
  watchedState.posts = updatedPosts;
};

const markPostAsRead = (post, markAsReadLink, cardHeader, postTitle) => {
  markAsReadLink.remove();

  const newLabel = cardHeader.querySelector('span');
  newLabel.remove();

  const badge = document.querySelector(
    `[data-source-id="${post.sourceId}"] .badge`
  );

  const numberOfUnreadPosts = parseInt(badge.textContent);
  if (numberOfUnreadPosts === 1) {
    badge.remove();
    return;
  }

  postTitle.classList.replace('font-weight-bold', 'font-weight-normal');
  badge.textContent = numberOfUnreadPosts - 1;
};

const buildNotificationBadge = () => {
  const badge = document.createElement('span');
  badge.classList.add(
    'badge',
    'badge-danger',
    'badge-pill',
    'p-1',
    'd-flex',
    'align-items-center'
  );
  badge.textContent = i18n.t('post.new');
  badge.setAttribute('data-translation-key', 'post.new');
  badge.style.maxHeight = '22px';
  return badge;
};

const buildNotificationBadgeCounter = (numberOfUnreadPosts) => {
  const notificationBadge = document.createElement('span');
  notificationBadge.classList.add(
    'badge',
    'badge-danger',
    'badge-pill',
    'mr-1',
    'd-flex',
    'align-items-center'
  );
  notificationBadge.textContent = numberOfUnreadPosts;
  notificationBadge.style.maxHeight = '22px';
  return notificationBadge;
};

const buildPostCard = (watchedState, post) => {
  const card = document.createElement('div');
  card.classList.add('card', 'shadow', 'mb-3');
  card.setAttribute('data-post-id', post.id);

  const cardHeader = document.createElement('div');
  cardHeader.classList.add(
    'card-header',
    'd-flex',
    'justify-content-between',
    'align-items-center'
  );

  const postTitle = document.createElement('h5');
  postTitle.classList.add('font-weight-normal', 'mb-0');
  postTitle.textContent = post.title;
  cardHeader.appendChild(postTitle);
  card.appendChild(cardHeader);

  const cartBody = document.createElement('div');
  cartBody.classList.add('card-body');

  const postDescription = document.createElement('p');
  postDescription.classList.add('card-text');
  postDescription.innerHTML = `${post.description.slice(0, 100)} ...`;

  const elementWrapper = document.createElement('div');
  elementWrapper.classList.add('wrapper');

  const previewBtn = document.createElement('button');
  previewBtn.textContent = i18n.t('post.btn');
  previewBtn.setAttribute('data-translation-key', 'post.btn');
  previewBtn.classList.add('btn', 'btn-secondary', 'mr-1');
  previewBtn.addEventListener('click', (e) => {
    showModalDialog(post);
    if (post.unread) {
      updateUnreadPosts(watchedState, post);
      markPostAsRead(post, markAsReadLink, cardHeader, postTitle);
    }
  });

  elementWrapper.appendChild(previewBtn);
  cartBody.appendChild(postDescription);
  cartBody.appendChild(elementWrapper);
  card.appendChild(cartBody);

  card.addEventListener('mouseenter', (e) => {
    e.preventDefault();
    card.classList.replace('shadow', 'shadow-sm');
    card.style.transition = 'box-shadow .5s';
    card.style.cursor = 'pointer';
  });

  card.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    card.classList.replace('shadow-sm', 'shadow');
    card.style.transition = 'box-shadow .5s';
    card.style.cursor = null;
  });

  if (!post.unread) {
    return card;
  }

  postTitle.classList.replace('font-weight-normal', 'font-weight-bold');
  const badge = buildNotificationBadge();
  cardHeader.appendChild(badge);

  const markAsReadLink = document.createElement('a');
  markAsReadLink.setAttribute('href', '#');
  markAsReadLink.textContent = i18n.t('post.markAsRead');
  markAsReadLink.setAttribute('data-translation-key', 'post.markAsRead');
  markAsReadLink.classList.add('text-muted', 'ml-2');
  markAsReadLink.addEventListener('click', (e) => {
    e.preventDefault();
    updateUnreadPosts(watchedState, post);
    markPostAsRead(post, markAsReadLink, cardHeader, postTitle);
  });
  elementWrapper.appendChild(markAsReadLink);
  return card;
};

const buildPostList = (watchedState) => {
  const postListContainer = document.createElement('div');
  postListContainer.classList.add('col-8', 'pr-4', 'border-left');

  const overflowContainer = document.createElement('div');
  overflowContainer.classList.add('overflow-auto');
  overflowContainer.style.maxHeight = '850px';
  overflowContainer.setAttribute('name', 'overflow-post-list');

  const posts = watchedState.posts.filter((post) => {
    return watchedState.activeSourceId === post.sourceId;
  });
  posts.forEach((post) =>
    overflowContainer.appendChild(buildPostCard(watchedState, post))
  );

  postListContainer.appendChild(overflowContainer);
  return postListContainer;
};

const buildRssSourceCard = (watchedState, rssSource) => {
  const card = document.createElement('div');
  card.classList.add('card', 'shadow', 'mb-2');
  card.setAttribute('data-source-id', rssSource.id);

  const cardHeader = document.createElement('div');
  cardHeader.classList.add(
    'card-header',
    'p-2',
    'd-flex',
    'justify-content-between',
    'align-items-center'
  );

  const rssTitle = document.createElement('p');
  rssTitle.classList.add('mb-0', 'font-weight-bold');
  rssTitle.textContent = rssSource.title;

  const notificationWrapper = document.createElement('div');
  notificationWrapper.style.minWidth = '100px';
  notificationWrapper.classList.add(
    'notificatonWrapper',
    'd-flex',
    'justify-content-center',
    'align-items-center',
    'pl-2'
  );

  const nubmerOfUnreadPosts = getNumberOfUnreadPosts(
    rssSource.id,
    watchedState.posts
  );

  if (nubmerOfUnreadPosts) {
    const notificationBadge = buildNotificationBadgeCounter(
      nubmerOfUnreadPosts
    );
    notificationWrapper.appendChild(notificationBadge);
  }

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body', 'p-3');

  const rssSourceDescription = document.createElement('p');
  rssSourceDescription.classList.add('mb-0');
  rssSourceDescription.textContent = rssSource.description;

  cardBody.appendChild(rssSourceDescription);
  cardHeader.appendChild(rssTitle);
  cardHeader.appendChild(notificationWrapper);
  card.appendChild(cardHeader);
  card.appendChild(cardBody);

  card.addEventListener('mouseenter', (e) => {
    e.preventDefault();
    if (!card.classList.contains('active')) {
      card.classList.replace('shadow', 'shadow-sm');
      card.style.transition = 'box-shadow .5s';
    }

    card.style.cursor = 'pointer';
    const deleteIcon = buildDeleteIcon(watchedState, rssSource);
    notificationWrapper.appendChild(deleteIcon);
  });

  card.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    if (!card.classList.contains('active')) {
      card.classList.replace('shadow-sm', 'shadow');
    }
    card.style.cursor = null;
    const deleteIcon = document.querySelector('.delete-icon');
    deleteIcon.remove();
  });

  card.addEventListener('click', (e) => {
    if (rssSource.id === watchedState.activeSourceId) return;
    watchedState.activeSourceId = rssSource.id;
  });

  if (watchedState.activeSourceId === rssSource.id) {
    card.classList.add('active');
    card.classList.replace('shadow', 'shadow-sm');
  }

  return card;
};

const renderStartPage = () => {
  const rssContent = document.querySelector('[name="rss-content"]');
  const container = document.createElement('div');
  container.classList.add(
    'col-12',
    'd-flex',
    'flex-column',
    'justify-content-center',
    'align-items-center',
    'mt-5'
  );

  const img = document.createElement('img');
  img.setAttribute('src', '/assets/images/feeds.png');

  const p = document.createElement('p');
  p.classList.add('h3', 'mb-2');
  p.textContent = 'Which sources would you like to follow?';

  container.appendChild(img);
  container.appendChild(p);
  rssContent.innerHTML = '';
  rssContent.appendChild(container);
};

const buildRssList = (watchedState) => {
  const rssList = document.createElement('div');
  rssList.classList.add('col-4');
  rssList.setAttribute('name', 'rss-source-list');

  const overflowContainer = document.createElement('div');
  overflowContainer.classList.add('overflow-auto');
  overflowContainer.style.maxHeight = '850px';

  watchedState.rssSources.forEach((rssSource) => {
    overflowContainer.appendChild(buildRssSourceCard(watchedState, rssSource));
  });

  rssList.appendChild(overflowContainer);
  return rssList;
};

const buildNotificationContainerForPostList = (watchedState, numberOfNewPosts) => {
  const container = document.createElement('div');
  container.classList.add(
    'mt-0',
    'mb-2',
    'rounded',
    'py-1',
    'bg-secondary',
    'text-center',
    'text-light'
  );
  container.setAttribute('name', 'notifications-for-post-list');
  container.style.position = 'sticky';
  container.style.top = '0px';
  container.style.zIndex = '1000';
  container.style.cursor = 'pointer';
  console.log('in building');

  const textBeforeBadge = document.createElement('span');
  textBeforeBadge.textContent = i18n.t('notificationForPostList.beforeBadge');

  const textAfterBadge = document.createElement('span');
  textAfterBadge.textContent = i18n.t('notificationForPostList.afterBadge');

  const badge = document.createElement('span');
  badge.classList.add('badge', 'badge-danger', 'mx-1');
  badge.textContent = `${numberOfNewPosts}`;

  container.appendChild(textBeforeBadge);
  container.appendChild(badge);
  container.appendChild(textAfterBadge);

  container.addEventListener('click', (e) => {
    const overflowContainer = document.querySelector(
      '[name="overflow-post-list"]'
    );
    const posts = watchedState.posts.filter((post) => {
      return watchedState.activeSourceId === post.sourceId;
    });
    overflowContainer.innerHTML = '';
    posts.forEach((post) =>
      overflowContainer.appendChild(buildPostCard(watchedState, post))
    );
    container.remove();
  });

  return container;
};

const renderNotificationBadgeForRssList = (rssSourceId, numberOfNewPosts) => {
  const rssSourceList = document.querySelector('[name="rss-source-list"]');
  const rssDOMElement = rssSourceList.querySelector(
    `[data-source-id="${rssSourceId}"]`
  );
  const notificationBadge = rssDOMElement.querySelector('span.badge');
  if (!notificationBadge) {
    const numberOfUnreadPosts = getNumberOfUnreadPosts(rssSourceId);
    notificationBadge = buildNotificationBadge(numberOfUnreadPosts);
    const badgeWrapper = rssDOMElement.querySelector('.notificatonWrapper');
    badgeWrapper.prepend(notificationBadge);
    return;
  }
  const unreadPostsNumber = parseInt(notificationBadge.textContent);
  notificationBadge.textContent = unreadPostsNumber + numberOfNewPosts;
};

const renderNotificationContainerForPostList = (watchedState, rssSourceId, numberOfNewPosts) => {
  if (rssSourceId === watchedState.activeSourceId) {
    const postList = document.querySelector('[name="overflow-post-list"]');
    let notificationContainer = document.querySelector(
      '[name="notifications-for-post-list"]'
    );
    console.log('notificationDiv', notificationContainer);
    if (!notificationContainer) {
      notificationContainer = buildNotificationContainerForPostList(
        watchedState,
        numberOfNewPosts
      );
    } else {
      const badge = notificationContainer.querySelector('.badge');
      const unreadPosts = parseInt(badge.textContent);
      badge.textContent = unreadPosts + numberOfNewPosts;
    }
    postList.prepend(notificationContainer);
  }

};

const renderUpdates = (watchedState, updates) => {
  const { rssSourceId, newPosts } = updates;
  const numberOfNewPosts = newPosts.length;
  renderNotificationBadgeForRssList(rssSourceId, numberOfNewPosts);
  renderNotificationContainerForPostList(
    watchedState,
    rssSourceId,
    numberOfNewPosts
  );
};

const renderRssContent = (watchedState) => {
  if (watchedState.rssSources.length === 0) {
    renderStartPage();
    return;
  }

  const rssContent = document.querySelector('[name="rss-content"]');
  const rssList = buildRssList(watchedState);
  const postList = buildPostList(watchedState);

  rssContent.innerHTML = '';
  rssContent.appendChild(rssList);
  rssContent.appendChild(postList);
};

const renderSucceedFeedback = (elemets) => {
  const { input, form } = elemets;
  const feedback = document.createElement('div');
  feedback.classList.add('valid-feedback');
  feedback.setAttribute('data-translation-key', 'header.form.succeedFeedback');
  feedback.textContent = i18n.t('header.form.succeedFeedback');

  input.classList.add('is-valid');
  input.after(feedback);
  form.reset();
  input.focus();

  setTimeout(() => {
    input.classList.remove('is-valid');
    feedback.remove();
  }, 3000);
};

const renderValidationErrors = (error, elements) => {
  const { input } = elements;

  const prevFeedback = input.nextSibling;
  if (prevFeedback) {
    prevFeedback.remove();
  }

  if (!error) {
    input.classList.remove('is-invalid');
    return;
  }

  const feedback = document.createElement('div');
  feedback.classList.add('invalid-feedback');
  feedback.textContent = error;

  input.classList.add('is-invalid');
  input.after(feedback);
};

const renderErrorAlert = (error, elements) => {
  const toast = document.createElement('div');
  toast.classList.add('toast', 'show');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  const toastHeader = document.createElement('div');
  toastHeader.classList.add('toast-header');

  const toastHeaderTitle = document.createElement('strong');
  toastHeaderTitle.classList.add('mr-auto');
  toastHeaderTitle.textContent = error.name;

  const toastBody = document.createElement('div');
  toastBody.classList.add('toast-body');
  toastBody.textContent = error.message;

  toastHeader.appendChild(toastHeaderTitle);
  toast.appendChild(toastHeader);
  toast.appendChild(toastBody);

  const body = document.querySelector('body');
  body.prepend(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

const processStateHandler = (processState, elements) => {
  const { submit } = elements;
  switch (processState) {
    case 'filling':
      submit.disabled = false;
      renderSucceedFeedback(elements);
      hideBtnSpinner(submit);
      break;
    case 'sending':
      submit.disabled = true;
      showBtnSpinner(submit);
      break;
    case 'failed':
      hideBtnSpinner(submit);
      submit.disabled = false;
      break;
    default:
      throw new Error(`Unknown state: ${processState}`);
  }
};

export default (state, elements) => {
  const { submit } = elements;
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value, elements);
        break;
      case 'form.valid':
        submit.disabled = !value;
        break;
      case 'form.error':
        renderValidationErrors(value, elements);
        break;
      case 'rssSources':
        renderRssContent(watchedState);
        break;
      case 'updates':
        renderUpdates(watchedState, value);
        break;
      case 'activeSourceId':
        renderRssContent(watchedState);
        break;
      case 'language':
        changeLanguage(value);
        break;
      case 'error':
        renderErrorAlert(value);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
