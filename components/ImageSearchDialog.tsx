"use client"

import { useState, useCallback } from "react"
import { Search, Upload, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import { Image } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

export default function ImageSearchDialog() {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file && file.type.startsWith('image/')) {
            setUploadedFile(file)
            // Create URL for preview
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
        } else {
            toast.error("Please upload a valid image file. Accepted formats are: .jpeg, .jpg, .png, .gif, .webp");
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: 1,
        noClick: true,
        noKeyboard: true,
    })

    const searchImages = async () => {
        if (!searchQuery) return;
        setIsLoading(true);
        try {
            const response = await axios.get("https://api.pexels.com/v1/search", {
                headers: { Authorization: process.env.PEXELS_API_KEY },
                params: { query: searchQuery, per_page: 5 },
            });
            console.log(response);
        } catch (error) {
            console.error(error);
        }

        setIsLoading(false);
    }

    const handleConfirm = () => {
        // Here you would typically upload the file to your server
        console.log("Uploading file:", uploadedFile)
        // Keep the dialog open so the user can see the confirmed image
        setIsOpen(false)
    }

    const handleCancel = () => {
        // Clean up the preview URL to avoid memory leaks
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setUploadedFile(null)
        setPreviewUrl("")
    }

    // Clean up function to revoke object URL when component unmounts
    const handleClose = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setIsOpen(false)
    }

    return (
        <>
            <button
                className="absolute bottom-4 right-4 bg-white bg-opacity-50 p-2 rounded-lg shadow-md flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out hover:w-36 w-10 text-black hover:bg-gray-100 group"
                onClick={() => setIsOpen(true)}
            >
                <div className="flex items-center w-full">
                    <Image size={20} className="flex-shrink-0" />
                    <span className="ml-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Change Image
                    </span>
                </div>
            </button>

            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <div {...getRootProps({ className: 'outline-none' })}>
                        <input {...getInputProps()} />
                        {uploadedFile ? (
                            <div className="text-center">
                                <div className="relative w-full max-w-xs mx-auto mb-4">
                                    <img
                                        src={previewUrl}
                                        alt="Uploaded preview"
                                        className="mx-auto max-h-48 object-contain rounded-md border"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Ready to upload</h3>
                                <p className="mb-4 text-sm text-gray-500 truncate">{uploadedFile.name}</p>
                                <div className="flex justify-center space-x-4">
                                    <Button onClick={handleConfirm}>Confirm</Button>
                                    <Button variant="outline" onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        handleCancel()
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`transition-all duration-300 ${isDragActive ? "bg-primary/10 border-primary" : ""}`}>
                                <DialogHeader>
                                    <DialogTitle className="flex justify-between items-center">
                                        <span>Search Images</span>
                                        <a href="https://www.pexels.com" className="mr-4">
                                            <img src="https://images.pexels.com/lib/api/pexels.png" alt="Pexels" className="inline-block h-6" />
                                        </a>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center space-x-2 my-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation()
                                            searchImages()
                                        }}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        placeholder="Search images..."
                                        className="flex-grow"
                                        value={searchQuery}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="bg-muted rounded-md aspect-square animate-pulse" />
                                    ))}
                                </div>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        open()
                                    }}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Image
                                </Button>
                                {isDragActive && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                                        <p className="text-lg font-semibold">Drop your image here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}