import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Icon } from '@/src/components/ui/icon'
import { MoreVerticalIcon } from 'lucide-react-native'
import * as React from 'react'
import { isValidElement, ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

type ObjectCardRootProps = {
  children: ReactNode
  className?: string
}

type ObjectCardHeaderProps = {
  children: ReactNode
}

type ObjectCardTitleProps = {
  children: ReactNode
}

type ObjectCardDescriptionProps = {
  children: ReactNode
}

type ObjectCardActionsProps = {
  onPress: () => void
}

type ObjectCardContentProps = {
  children: ReactNode
}

function ObjectCardRoot({ children, className }: ObjectCardRootProps) {
  return <Card className={className}>{children}</Card>
}

function ObjectCardHeader({ children }: ObjectCardHeaderProps) {
  const childrenArray = React.Children.toArray(children)

  const title = childrenArray.find(
    (child): child is ReactElement =>
      isValidElement(child) && child.type === ObjectCardTitle
  )

  const description = childrenArray.find(
    (child): child is ReactElement =>
      isValidElement(child) && child.type === ObjectCardDescription
  )

  const actions = childrenArray.find(
    (child): child is ReactElement =>
      isValidElement(child) && child.type === ObjectCardActions
  )

  if (description)
    return (
      <CardHeader className="flex-row justify-between items-start">
        <View className="flex-col">
          {title && (
            <ObjectCardTitle>
              {(title as ReactElement<{ children: ReactNode }>).props.children}
            </ObjectCardTitle>
          )}

          <ObjectCardDescription>
            {
              (description as ReactElement<{ children: ReactNode }>).props
                .children
            }
          </ObjectCardDescription>
        </View>

        {actions}
      </CardHeader>
    )

  return (
    <CardHeader className="flex-row justify-between items-center">
      {title && (
        <ObjectCardTitle>
          {(title as ReactElement<{ children: ReactNode }>).props.children}
        </ObjectCardTitle>
      )}

      {actions}
    </CardHeader>
  )
}

function ObjectCardTitle({ children }: ObjectCardTitleProps) {
  return <CardTitle className="text-foreground font-bold">{children}</CardTitle>
}

function ObjectCardDescription({ children }: ObjectCardDescriptionProps) {
  return <CardDescription className="ml-2">{children}</CardDescription>
}

function ObjectCardActions({ onPress }: ObjectCardActionsProps) {
  return (
    <Pressable
      onPress={onPress}
      className="ml-2 rounded-md p-2 active:bg-accent"
    >
      <Icon as={MoreVerticalIcon} className="text-muted-foreground" />
    </Pressable>
  )
}

function ObjectCardContent({ children }: ObjectCardContentProps) {
  return <CardContent>{children}</CardContent>
}

export const ObjectCard = {
  Root: ObjectCardRoot,
  Header: ObjectCardHeader,
  Title: ObjectCardTitle,
  Description: ObjectCardDescription,
  Actions: ObjectCardActions,
  Content: ObjectCardContent,
}
