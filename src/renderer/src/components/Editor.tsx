import React, { useMemo, useRef, useEffect } from "react";
import styled, { css } from 'styled-components'
import './ToolBar.module.css'

type TextareaProps = {
  value: string;
  numOfLines: number;
  onValueChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  key: string;
  updateValue: (newvalue) => void;
  updateContent: boolean
  updateContentChange: () => void
};

const StyledTextareaWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`;

const sharedStyle = css`
  margin: 0;
  padding: 10px 0;
  height: 100%;
  border-radius: 0;
  resize: none;
  outline: none;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.2;
  &:focus-visible {
    outline: none;
  }
`;

const StyledTextarea = styled.textarea`
  ${sharedStyle}
  padding-left: 3.5rem;
  display: inline-block;
  width: calc(100% - 70px);
  border: none;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.8);
  float: left;
  &::placeholder {
    color: white;
  }
`;

const StyledNumbers = styled.div`
  ${sharedStyle}
  display: inline-block;
  float: left;
  overflow-y: hidden;
  text-align: right;
  box-shadow: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  background-color: transparent;
  padding: 10px;
  width: 2.5rem;
`;

const StyledNumber = styled.div<{ active: boolean }>`
  color: ${(props) => (props.active ? "rgba(255,255,255,.5)" : "inherit")};
`;

export const Editor = ({
  value,
  numOfLines,
  onValueChange,
  placeholder = '',
  name,
  key,
  updateValue,
  updateContent,
  updateContentChange
}: TextareaProps) => {
  const lineCount = useMemo(() => value.split('\n').length, [value])
  const linesArr = useMemo(
    () => Array.from({ length: Math.max(numOfLines, lineCount) }, (_, i) => i + 1),
    [lineCount, numOfLines]
  );

  const lineCounterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      updateContentChange()
    }, 1000)
  }, [value])

  useEffect(() => {
    console.log(updateContent);
  }, [updateContent])


  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(event.target.value);
    updateValue(event.target.value)
  };


  const Changeinternally = (event) => {
    if (textareaRef.current) {
      console.log(event);
      textareaRef.current.value = event.target.value;
      if (event.keyCode === 13) {
        updateValue(event.target.value)
      }
    }
  }

  const handleTextareaScroll = () => {
    if (lineCounterRef.current && textareaRef.current) {
      lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <StyledTextareaWrapper>
      <StyledNumbers ref={lineCounterRef}>
        {linesArr.map((count) => (
          <StyledNumber active={count <= lineCount} key={count}>
            {count}
          </StyledNumber>
        ))}
      </StyledNumbers>
      {updateContent ? (
        <StyledTextarea
          name={name}
          onBlur={handleTextareaChange}
          onScroll={handleTextareaScroll}
          placeholder={placeholder}
          ref={textareaRef}
          value={value}
          wrap="off"
          key={key}
        />
      ) : (
        <StyledTextarea
          name={name}
          onBlur={handleTextareaChange}
          onScroll={handleTextareaScroll}
          placeholder={placeholder}
          ref={textareaRef}
          defaultValue={value}
          wrap="off"
          key={key}
          onKeyDown={Changeinternally}
          onKeyUp={Changeinternally}
        />
      )}
    </StyledTextareaWrapper>
  );
};