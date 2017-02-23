#ElementSize

This is an elm package to track the size of an HTML element when it resizes. It provides the following measurements:

* height
* width
* top
* left

You can track changes to the size of an HTML element by using a subscription as shown in the example below. You can also just get a single 
measurement using a Task as is shown by getInitialSize.

#Examples

    subscriptions : Model -> Sub Msg
    subscriptions model =
    Sub.batch [
      ElementSize.resizes ".watch-me" (\{ selector, height, width, top, left } -> Resize selector height width top left)
      , ElementSize.resizes ".track-me" (\{ selector, height, width, top, left } -> Resize selector height width top left)
    ]


    getInitialSize : Cmd Msg
    getInitialSize =
    Task.perform sizeToMsg (ElementSize.size ".watch-me")


    sizeToMsg : ElementSize.Event -> Msg
    sizeToMsg { selector, height, width, top, left } =
    Resize selector height width top left
