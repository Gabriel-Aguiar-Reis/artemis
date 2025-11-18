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
import { Pressable } from 'react-native'

type ObjectCardRootProps = {
  children: React.ReactNode
  className?: string
}

type ObjectCardHeaderProps = {
  children: React.ReactNode
}

type ObjectCardTitleProps = {
  children: React.ReactNode
}

type ObjectCardDescriptionProps = {
  children: React.ReactNode
}

type ObjectCardActionsProps = {
  onPress: () => void
}

type ObjectCardContentProps = {
  children: React.ReactNode
}

function ObjectCardRoot({ children, className }: ObjectCardRootProps) {
  return <Card className={className}>{children}</Card>
}

function ObjectCardHeader({ children }: ObjectCardHeaderProps) {
  return (
    <CardHeader className="flex-row items-center justify-between">
      {children}
    </CardHeader>
  )
}

function ObjectCardTitle({ children }: ObjectCardTitleProps) {
  return <CardTitle className="text-foreground font-bold">{children}</CardTitle>
}

function ObjectCardDescription({ children }: ObjectCardDescriptionProps) {
  return <CardDescription>{children}</CardDescription>
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
