effect module ElementSize
    where { subscription = MySub }
    exposing
        ( Event
        , size
        , width
        , height
        , top
        , left
        , resizes
        )

{-| This library helps you figure out the width, height, top and left of an html element.

# Element Size
@docs Event, size, width, height, top, left, resizes

-}

import Json.Decode as Json
import Native.ElementSize
import Process
import Task exposing (Task)


{-| Track element resizing
-}
onResize : String -> Json.Decoder msg -> (msg -> Task Never ()) -> Task Never Never
onResize =
    Native.ElementSize.onResize


{-| The size of the specified element in pixels.
-}
type alias Event =
    { selector : Selector
    , width : Int
    , height : Int
    , top : Int
    , left : Int
    }


{-| Get the specified element size.
-}
size : Selector -> Task x Event
size selector =
    Native.ElementSize.size selector


{-| Get the specified element width.
-}
width : Selector -> Task x Int
width selector =
    Task.map .width (size selector)


{-| Get the specified element height.
-}
height : Selector -> Task x Int
height selector =
    Task.map .height (size selector)


{-| Get the specified element top.
-}
top : Selector -> Task x Int
top selector =
    Task.map .top (size selector)


{-| Get the specified element left.
-}
left : Selector -> Task x Int
left selector =
    Task.map .left (size selector)


{-| Subscribe to any changes in the specified element size.
-}
resizes : Selector -> (Event -> msg) -> Sub msg
resizes selector tagger =
    subscription (MySub selector tagger)



-- SUBSCRIPTIONS


type alias Selector =
    String


type MySub msg
    = MySub Selector (Event -> msg)


subMap : (a -> b) -> MySub a -> MySub b
subMap func (MySub selector tagger) =
    MySub selector (tagger >> func)



-- EFFECT MANAGER


type alias State msg =
    Maybe
        { subs : List (MySub msg)
        , pids : List Process.Id
        }


init : Task Never (State msg)
init =
    Task.succeed Nothing


(&>) : Task x a -> Task x b -> Task x b
(&>) task1 task2 =
    Task.andThen (\_ -> task2) task1


onEffects : Platform.Router msg Event -> List (MySub msg) -> State msg -> Task Never (State msg)
onEffects router newSubs oldState =
    case ( oldState, newSubs ) of
        ( Nothing, [] ) ->
            Task.succeed Nothing

        ( Just { pids }, [] ) ->
            (List.map Process.kill pids
                |> Task.sequence
            )
                &> Task.succeed Nothing

        ( Nothing, subs ) ->
            subs
                |> selectors
                |> List.map (resizeTask router)
                |> spawnMany
                |> Task.andThen (\pids -> Task.succeed (Just { subs = newSubs, pids = pids }))

        ( Just { pids }, _ ) ->
            Task.succeed (Just { subs = newSubs, pids = pids })


selectors : List (MySub msg) -> List Selector
selectors =
    List.map (\(MySub selector _) -> selector)


spawnMany : List (Task Never Never) -> Task Never (List Process.Id)
spawnMany tasks =
    tasks
        |> List.map Process.spawn
        |> Task.sequence


resizeTask : Platform.Router a Event -> Selector -> Task Never Never
resizeTask router selector =
    onResize selector (Json.succeed ()) (\_ -> Task.andThen (Platform.sendToSelf router) (size selector))


findSubs : Event -> MySub msg -> Bool
findSubs event (MySub selector _) =
    selector == event.selector


onSelfMsg : Platform.Router msg Event -> Event -> State msg -> Task Never (State msg)
onSelfMsg router event state =
    case state of
        Nothing ->
            Task.succeed state

        Just { subs } ->
            let
                mySubs =
                    List.filter (findSubs event) subs

                send (MySub _ tagger) =
                    Platform.sendToApp router (tagger event)
            in
                Task.sequence (List.map send mySubs)
                    &> Task.succeed state
