import reactTextareaAutosize from 'react-textarea-autosize'
import styled from 'styled-components'

export const TextArea = styled(reactTextareaAutosize)`
  font: unset;

  font-size: var(--alpha-font-size-14);
  resize: vertical;

  display: flex;
  align-items: center;

  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 8px 12px;

  color: var(--txt-black-darkest);
  overflow-wrap: anywhere;

  border: none;
  outline: none;

  transition:
    border-color var(--transition-s),
    box-shadow var(--transition-s);

  &::-webkit-scrollbar {
    display: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--opacity-disabled);
  }

  &[aria-invalid='true'] {
    background-color: var(--bg-white-normal);
    box-shadow: var(--input-box-shadow-invalid);
  }

  &:read-only {
    color: var(--txt-black-darker);
    background-color: var(--bg-grey-lighter);
  }
`
