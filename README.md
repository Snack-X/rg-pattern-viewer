# Rhythm Game Pattern Viewer

Putting various old logics together.

## Supported

* Starlight Stage JSON

## Planned

* Be-Music Script / PMS

## Problem

* General
  * Interface sucks
* SS JSON
  * Images are not antialiased when options are changed
  * True slide note is not supported

---

```
Array<SSJsonEvent> SSJson

Object SSJsonEvent {
  Number id;
  Number sec;            // second
  SSJsonEventType type;
  Number startPos;       // 1 ~ 5, not used on this app
  Number finishPos;      // 1 ~ 5
  Number status;
  Number sync;
  Number groupId;
}

Number SSJsonEventType {
  NoteNormal =   1,  // or also a long note
  NoteFlick  =   2,
  __unk81__  =  81,
  __unk82__  =  82,
  __unk91__  =  91,
  PatternEnd =  92,
  Notecount  = 100,
}
```
